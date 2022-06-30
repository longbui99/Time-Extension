import time 


stime = time.time()

for i in range(0, 100000000):
    # t = i%2 and i/2 or i-1
    t = i/2 if i%2 else i-1


print((time.time()-stime)/1000)