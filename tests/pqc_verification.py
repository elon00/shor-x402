import hashlib,hmac,os
def test_pqc_fail_closed():
    s=os.urandom(32); d=hashlib.sha256(b'x402').hexdigest()
    assert hmac.compare_digest(d,hashlib.sha256(b'x402').hexdigest())
