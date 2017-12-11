"""
Implement a simple binary protocol for Monitor mode
Normally, a stream of bytes will flow, except for 0x1b, that is used
to indicate the start of a RPC. Real (esc) chars need to be escaped.
"""
import struct
import os
import select
import hashlib
import binascii
import time
import json
class ReadTimeout(Exception):
 pass
class SerialPortConnection(object):
 def __init__(self):
  import machine
  self.disconnectWLAN()
  self.original_term=os.dupterm()
  os.dupterm(None)
  self.serial=machine.UART(0,115200)
  self.poll=select.poll()
  self.poll.register(self.serial,select.POLLIN)
  self.write=self.serial.write
 def isWipy1(self):
  return os.uname().machine=="WiPy with CC3200"
 def disconnectWLAN(self):
  try:
   from network import WLAN
   wlan=None
   if self.isWipy1():
    wlan=WLAN()
   else:
    wlan=WLAN(mode=WLAN.STA)
   wlan.disconnect()
  except:
   pass
 def destroy(self):
  os.dupterm(self.original_term)
 def read(self,length):
  if not self.poll.poll(TIMEOUT):
   raise ReadTimeout
  return self.serial.read(length)
class SocketConnection(object):
 def __init__(self):
  from network import Server
  import socket
  server=Server()
  self.is_telnet_running=server.isrunning()
  server.deinit()
  self.poll=select.poll()
  listening=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
  listening.bind(('',23))
  listening.listen(1)
  self.socket=listening.accept()[0]
  listening.close()
  self.poll.register(self.socket,select.POLLIN)
  self.socket.setblocking(False)
  self.write=self.socket.write
 def destroy(self):
  self.socket.close()
  if self.is_telnet_running is True:
   from network import Server
   Server().init(login=telnet_login)
 def read(self,length):
  if not self.poll.poll(TIMEOUT):
   raise ReadTimeout
  return self.socket.read(length)
class TransferError(Exception):
 def __init__(self,value,str_val):
  self.value=value
  self.str_val=str_val
 def __str__(self):
  return self.str_val
class InbandCommunication(object):
 def __init__(self,stream,callback):
  self.stream=stream
  self.carry_over=b''
  self.callback=callback
 def read(self,size,getESC=True):
  data=self.stream.read(size)
  if self.carry_over!=b'':
   data=self.carry_over+data
   self.carry_over=b''
  esc_pos=data.find(b'\x1b')
  if getESC==False and esc_pos>0:
   esc_pos=-1
  while esc_pos!=-1:
   max_idx=len(data)-1
   if esc_pos!=max_idx:
    if data[esc_pos+1]==0x1b:
     data=data[:esc_pos]+data[esc_pos+1:]
     esc_pos+=1
    else:
     if max_idx-esc_pos<2:
      self.carry_over=data[esc_pos:max_idx+1]
      data=data[0:esc_pos]
     else:
      command=data[esc_pos+1:esc_pos+3]
      self.carry_over=data[esc_pos+3:max_idx+1]
      cont=self.callback(command)
      if cont is True:
       data=data[0:esc_pos]
      else:
       raise TransferError(0,'aborted')
     break
    esc_pos=data.find(b'\x1b',esc_pos)
   else:
    data=data[:-1]
    self.carry_over=b'\x1b'
    break
  return data
 def read_exactly(self,size,getESC=True):
  data=b''
  while 1:
   data+=self.read(size,getESC)
   if len(data)==size:
    return data
   if len(data)<size:
    continue
   self.carry_over=data[size:]+self.carry_over
   return data[:size]
 def send(self,data):
  self.stream.write(data)
class Monitor(object):
 def __init__(self):
  if connection_type=='u':
   self.connection=SerialPortConnection()
  else:
   self.connection=SocketConnection()
  self.stream=InbandCommunication(self.connection,self.process_command)
  self.commands={b"\x00\x00":self.ack,b"\x00\xFE":self.reset_board,b"\x00\xFF":self.exit_monitor,b"\x01\x00":self.write_to_file,b"\x01\x01":self.read_from_file,b"\x01\x02":self.remove_file,b"\x01\x03":self.hash_last_file,b"\x01\x04":self.create_dir,b"\x01\x05":self.remove_dir,b"\x01\x06":self.list_files,b"\x01\x07":self.mem_free,}
 def process_command(self,cmd):
  return self.commands[cmd]()
 def read_int16(self):
  two_chars=self.stream.read_exactly(2)
  return struct.unpack('>H',two_chars)[0]
 def read_int32(self):
  v=self.stream.read_exactly(4,False)
  return struct.unpack('>L',v)[0]
 def write_int16(self,value):
  self.stream.send(struct.pack('>H',value))
 def write_int32(self,value):
  time.sleep_ms(100)
  self.stream.send(struct.pack('>L',value))
  time.sleep_ms(100)
 def init_hash(self,length):
  self.last_hash=hashlib.sha256(b'',length)
 @staticmethod
 def block_split_helper(length):
  if length>1024:
   return(1024,length-1024)
  else:
   return(length,0)
 def ack(self):
  self.stream.send(b'\x1b\x00\x00')
  return True
 def reset_board(self):
  import machine
  machine.reset()
 def exit_monitor(self):
  self.running=False
  self.connection.destroy()
 @staticmethod
 def encode_str_len32(contents):
  return struct.pack('>L',len(contents))
 @staticmethod
 def encode_str_len16(string):
  return struct.pack('>H',len(string))
 def mem_free(self):
  import os
  try:
   self.write_int16(os.getfree('/flash'))
  except AttributeError:
   self.write_int16(350000)
 def write_to_file(self):
  print("Writing to file")
  name=self.stream.read_exactly(self.read_int16())
  dest=open(name,"w")
  data_len=self.read_int32()
  while data_len!=0:
   data=self.stream.read_exactly(min(data_len,256))
   print("Writing data")
   dest.write(data)
   data_len-=len(data)
  print("closing file")
  return dest.close()
 def read_from_file(self):
  filename=self.stream.read_exactly(self.read_int16())
  print("Reading from "+str(filename))
  try:
   data_len=os.stat(filename)[6]
  except OSError:
   self.write_int32(0x00000000)
   return
  print("Sending data len "+str(data_len))
  self.write_int32(data_len)
  source=open(filename,'r')
  while data_len!=0:
   to_read,data_len=Monitor.block_split_helper(data_len)
   data=source.read(to_read)
   print("Sending data...")
   self.stream.send(data)
  print("Done!")
  source.close()
 def remove_file(self):
  try:
   os.remove(self.stream.read_exactly(self.read_int16()))
  except OSError:
   pass
 def hash_last_file(self):
  digest=self.last_hash.digest()
  self.write_int16(len(digest))
  self.stream.send(digest)
 def create_dir(self):
  try:
   os.mkdir(self.stream.read_exactly(self.read_int16()))
  except OSError:
   pass
 def remove_dir(self):
  try:
   dirname=self.stream.read_exactly(self.read_int16())
   os.rmdir(dirname)
  except OSError as e:
   pass
 def list_files(self,directory=''):
  files=os.listdir(directory)
  file_list=[]
  for f in files:
   if directory!='':
    f=directory+"/"+f
   try:
    file_list+=self.list_files(f)
   except:
    file_list.append([f,'f'])
  if directory!='':
   return file_list
  json_list=json.dumps(file_list)
  data_len=len(json_list)
  print("Sending data len of "+str(data_len))
  self.write_int32(data_len)
  i=0
  while data_len!=0:
   to_read,data_len=Monitor.block_split_helper(data_len)
   read_from=i*1024
   data=json_list[read_from:read_from+to_read]
   print("Sending data...")
   self.stream.send(data)
   i+=1
  print("done")
 def hash_string(self,s):
  h=hashlib.sha256(s)
  return binascii.hexlify(h.digest())
 def print_payload(self,data):
  bin_str=""
  for d in data:
   bin_str+="{0:08b}".format(d)+" "
  print(bin_str)
 def start_listening(self):
  self.running=True
  while self.running is True:
   try:
    self.stream.read(1)
   except TransferError as e:
    pass
   except ReadTimeout:
    print("ReadTimeout, exit monitor")
    self.exit_monitor()
    self.reset_board()
if __name__=='__main__':
 monitor=Monitor()
 monitor.start_listening()
