"""
Implement a simple binary protocol for Monitor mode

Normally, a stream of bytes will flow, except for 0x1b, that is used
to indicate the start of a RPC. Real (esc) chars need to be escaped.
"""

import struct
import os
import select
import hashlib
import time

class ReadTimeout(Exception):
    pass

class SerialPortConnection(object):
    def __init__(self):
        import machine
        self.disconnectWLAN()
        self.original_term = os.dupterm()
        os.dupterm(None) # disconnect the current serial port connection
        self.serial = machine.UART(0, 115200)
        self.poll = select.poll()
        self.poll.register(self.serial, select.POLLIN)
        self.write = self.serial.write

    def disconnectWLAN(self):
        # disconnedt wlan because it spams debug messages that disturb the monitor protocol
        from network import WLAN
        wlan = WLAN(mode=WLAN.STA)
        wlan.disconnect()

    def destroy(self):
        os.dupterm(self.original_term)

    def read(self, length):
        if not self.poll.poll(TIMEOUT): # timeout is loaded at runtime
            raise ReadTimeout
        return self.serial.read(length)

class SocketConnection(object):
    def __init__(self):
        from network import Server
        import socket
        server = Server()
        self.is_telnet_running = server.isrunning()
        server.deinit()
        self.poll = select.poll()
        listening = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        listening.bind(('', 23))
        listening.listen(1)
        self.socket = listening.accept()[0]
        listening.close()
        self.poll.register(self.socket, select.POLLIN)
        self.socket.setblocking(False)
        self.write = self.socket.write

    def destroy(self):
        self.socket.close()
        if self.is_telnet_running is True:
            from network import Server
            Server().init(login=telnet_login) # telnet_login is appended to the code at upload time

    def read(self, length):
        if not self.poll.poll(TIMEOUT): # timeout is loaded at runtime
            raise ReadTimeout
        return self.socket.read(length)

class TransferError(Exception):
    def __init__(self, value, str_val):
        self.value = value
        self.str_val = str_val

    def __str__(self):
        return self.str_val

class InbandCommunication(object):
    def __init__(self, stream, callback):
        self.stream = stream
        self.carry_over = b''
        self.callback = callback

    def read(self, size, getESC=True):
        data = self.stream.read(size)
        if self.carry_over != b'': # check if a previous call generated a surplus
            data = self.carry_over + data
            self.carry_over = b''
        esc_pos = data.find(b'\x1b') # see if there is any ESC in the bytestream

        # ignore only esc's in middle of a package, not at the start
        if getESC == False and esc_pos > 0:
            esc_pos = -1

        while esc_pos != -1:
            max_idx = len(data) - 1
            if esc_pos != max_idx:
                # the ESC is not at the end
                if data[esc_pos + 1] == 0x1b:
                    # this is an escaped ESC
                    data = data[:esc_pos] + data[esc_pos + 1:]
                    esc_pos += 1
                else:
                    # process a real ESC here
                    if max_idx - esc_pos < 2:
                        # no enough bytes to continue
                        # save the ones that belong to the command
                        self.carry_over = data[esc_pos:max_idx + 1]
                        data = data[0:esc_pos]
                    else:

                        # get the command name
                        command = data[esc_pos + 1:esc_pos + 3]
                        # and store the rest for the next round
                        self.carry_over = data[esc_pos + 3:max_idx + 1]
                        cont = self.callback(command)
                        if cont is True:
                            data = data[0:esc_pos]
                        else:
                            raise TransferError(0, 'aborted')
                    break

                esc_pos = data.find(b'\x1b', esc_pos)
            else:
                data = data[:-1]
                self.carry_over = b'\x1b' # buffer the lonely ESC for the future
                break
        return data

    def read_exactly(self, size, getESC=True):
        data = b''
        while 1:
            data += self.read(size,getESC)
            if len(data) == size:
                return data

            if len(data) < size:
                continue

            # if in here, len(data) > size, store the surplus bytes
            self.carry_over = data[size:] + self.carry_over
            return data[:size]

    def send(self, data):
        self.stream.write(data)

class Monitor(object):
    def __init__(self):
        if connection_type == 'u': # connection type is appended to the code at upload time
            self.connection = SerialPortConnection()
        else:
            self.connection = SocketConnection()
        self.stream = InbandCommunication(self.connection, self.process_command)
        self.commands = {
            b"\x00\x00": self.ack,
            b"\x00\xFE": self.reset_board,
            b"\x00\xFF": self.exit_monitor,
            b"\x01\x00": self.write_to_file,
            b"\x01\x01": self.read_from_file,
            b"\x01\x02": self.remove_file,
            b"\x01\x03": self.hash_last_file,
            b"\x01\x04": self.create_dir,
            b"\x01\x05": self.remove_dir,
        }

    def process_command(self, cmd):
        return self.commands[cmd]()

    def read_int16(self):
        two_chars = self.stream.read_exactly(2)
        return struct.unpack('>H', two_chars)[0]

    def read_int32(self):
        v = self.stream.read_exactly(4,False)
        return struct.unpack('>L', v)[0]

    def write_int16(self, value):
        self.stream.send(struct.pack('>H', value))

    def write_int32(self, value):
        self.stream.send(struct.pack('>L', value))

    def init_hash(self, length):
        self.last_hash = hashlib.sha256(b'', length)

    @staticmethod
    def block_split_helper(length):
        if length > 1024:
            return (1024, length - 1024)
        else:
            return (length, 0)

    def ack(self):
        self.stream.send(b'\x1b\x00\x00')
        return True

    def reset_board(self):
        import machine
        machine.reset()

    def exit_monitor(self):
        from network import WLAN
        wlan = WLAN(mode=WLAN.STA_AP)
        self.running = False
        self.connection.destroy()


    @staticmethod
    def encode_str_len32(contents):
        return struct.pack('>L', len(contents))

    @staticmethod
    def encode_str_len16(string):
        return struct.pack('>H', len(string))

    def write_to_file(self):
        print("Writing to file")
        name = self.stream.read_exactly(self.read_int16())

        dest = open(name, "w")

        data_len = self.read_int32()

        while data_len != 0:
            data = self.stream.read_exactly(min(data_len, 256))
            print("Writing data")
            dest.write(data)
            data_len -= len(data)

        print("closing file")
        return dest.close()

    def read_from_file(self):
        filename = self.stream.read_exactly(self.read_int16())
        if connection_type == 'u':
            time.sleep_ms(300)
        try:
            data_len = os.stat(filename)[6]
        except OSError:
            self.write_int32(0x00000000)
            return

        self.write_int32(data_len)
        if connection_type == 'u':
            time.sleep_ms(300)

        source = open(filename, 'r')
        while data_len != 0:
            to_read, data_len = Monitor.block_split_helper(data_len)
            data = source.read(to_read)
            self.stream.send(data)
        source.close()

    def remove_file(self):
        try:
            os.remove(self.stream.read_exactly(self.read_int16()))
        except OSError:
            pass

    def hash_last_file(self):
        digest = self.last_hash.digest()
        self.write_int16(len(digest))
        self.stream.send(digest)

    def create_dir(self):
        try:
            os.mkdir(self.stream.read_exactly(self.read_int16()))
        except OSError:
            pass

    def remove_dir(self):
        try:
            dirname = self.stream.read_exactly(self.read_int16())
            os.rmdir(dirname)
        except OSError as e:
            pass

    def start_listening(self):
        self.running = True
        while self.running is True:
            try:
                self.stream.read(1)
            except TransferError as e:
                pass
            except ReadTimeout:
                print("ReadTimeout, exit monitor")
                self.exit_monitor()

if __name__ == '__main__':
    monitor = Monitor()
    monitor.start_listening()
