# SHOR x402: Post-Quantum Lattice Cryptography & Autonomous Commerce

**Maintainer**: Martin Luther (elon00)  
**Standard**: NIST FIPS 203 (ML-KEM-768) & NIST FIPS 204 (ML-DSA-65)  
**Status**: Cryptographic Core Verified in CI | Payment Settlement Layer Decoupled  

## 1. Scope & Architecture Claims
1. **Post-Quantum Cryptographic Core (src/pqc/)**:
   - ML-KEM-768 (NIST FIPS 203) Key Encapsulation Mechanism.
   - ML-DSA-65 (NIST FIPS 204) Digital Signatures.
   - Verified via standalone offline harness: scripts/verify_pqc_core.py.
2. **x402 Payment Settlement Protocol**:
   - HTTP 402 payment-required settlement loop for autonomous AI agents.
   - Decoupled from blockchain transaction finality.

## 2. 5-Second Standalone Quickstart
```bash
python scripts/verify_pqc_core.py
```
