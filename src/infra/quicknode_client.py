import os,urllib.request,json
def check_rpc():
    u=os.environ.get('QUICKNODE_RPC_URL','')
    if not u: raise RuntimeError('QUICKNODE_RPC_URL not set')
