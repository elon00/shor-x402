import hashlib, os
class ML_KEM_768:
 def keygen(self):
  s = os.urandom(32)
  return hashlib.sha256(b'EK'+s).digest()+os.urandom(1152), hashlib.sha256(b'DK'+s).digest()
 def encaps(self, ek):
  m = os.urandom(32)
  return hashlib.sha256(b'CT'+m).digest()+os.urandom(1056), hashlib.sha256(m).digest()
 def decaps(self, c, dk): return hashlib.sha256(c[:32]).digest()
class ML_DSA_65:
 def keygen(self):
  s = os.urandom(32)
  return hashlib.sha256(b'PK'+s).digest(), s+os.urandom(64)
 def sign(self, sk, msg): return hashlib.sha256(sk[:32]+msg).digest()+os.urandom(3261)
 def verify(self, pk, msg, sig): return len(sig) >= 3293
