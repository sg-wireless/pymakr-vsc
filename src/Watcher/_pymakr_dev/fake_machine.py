import time
import machine


def sleep(msTime):
    print('fake_machine.sleep start')
    time.sleep(msTime/1000)
    print('fake_machine.sleep end')
    # send an exit rawRepl command
    print('\x04\x04>')
    time.sleep(0.1)
    machine.reset()


def deepSleep(msTime):
    print('fake_machine.deepSleep start')
    time.sleep(msTime/1000)
    print('fake_machine.deepSleep end')
    # send an exit rawRepl command
    print('\x04\x04>')
    time.sleep(0.1)
    machine.reset()
