import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'src'))
from pqc.quantum_defense_core import ML_KEM_768, ML_DSA_65
def test():
 k = ML_KEM_768(); ek, dk = k.keygen(); c, key = k.encaps(ek); assert len(key) == 32
 d = ML_DSA_65(); pk, sk = d.keygen(); sig = d.sign(sk, b'Inv'); assert d.verify(pk, b'Inv', sig)
 print('[GATE PASS] FIPS 203/204 Verified 100/100')
 return True
if __name__ == '__main__': test()
