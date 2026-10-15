"""
TaxFlow UK - Validation & Cryptographic Sidecar Service
FastAPI service executing W3C C14N canonicalization, IRmark hashing,
and FRS 105 iXBRL schema validation using lxml.
"""

from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import lxml.etree as ET
import hashlib
import base64
import re

app = FastAPI(
    title="TaxFlow UK Validator Sidecar",
    description="Regulatory-grade iXBRL and GovTalk XML validation sidecar",
    version="1.0.0"
)

HMRC_BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

def encode_base32(data: bytes) -> str:
    bits = 0
    val = 0
    out = []
    for b in data:
      val = (val << 8) | b
      bits += 8
      while bits >= 5:
        out.append(HMRC_BASE32_ALPHABET[(val >> (bits - 5)) & 31])
        bits -= 5
    if bits > 0:
      out.append(HMRC_BASE32_ALPHABET[(val << (5 - bits)) & 31])
    return "".join(out)

class IRmarkRequest(BaseModel):
    xml_payload: str

class IRmarkResponse(BaseModel):
    irmark_base64: str
    irmark_base32: str
    canonical_body_xml: str

class IxbrlValidationRequest(BaseModel):
    ixbrl_html: str

class IxbrlValidationResponse(BaseModel):
    is_valid_xml: bool
    namespaces_found: list[str]
    missing_mandatory_namespaces: list[str]
    errors: list[str]
    warnings: list[str]

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "validator-sidecar", "engine": "lxml-c14n"}

@app.post("/compute-irmark", response_model=IRmarkResponse)
def compute_irmark_endpoint(req: IRmarkRequest):
    try:
        raw_xml = req.xml_payload.strip()
        # Parse XML
        root = ET.fromstring(raw_xml.encode("utf-8"))

        # Locate Body element
        body_node = None
        if root.tag.endswith("Body"):
            body_node = root
        else:
            for child in root.iter():
                if child.tag.endswith("Body"):
                    body_node = child
                    break

        if body_node is None:
            raise HTTPException(status_code=400, detail="XML payload does not contain a <Body> node")

        # Strip any existing <IRmark> elements inside Body
        for elem in body_node.xpath('.//*[local-name()="IRmark"]'):
            parent = elem.getparent()
            if parent is not None:
                parent.remove(elem)

        # Canonicalise Body using W3C C14N
        c14n_bytes = ET.tostring(body_node, method="c14n", exclusive=False, with_comments=False)
        
        # Compute SHA-1 digest
        sha1_digest = hashlib.sha1(c14n_bytes).digest()
        irmark_b64 = base64.b64encode(sha1_digest).decode("ascii")
        irmark_b32 = encode_base32(sha1_digest)

        return IRmarkResponse(
            irmark_base64=irmark_b64,
            irmark_base32=irmark_b32,
            canonical_body_xml=c14n_bytes.decode("utf-8")
        )
    except ET.XMLSyntaxError as e:
        raise HTTPException(status_code=400, detail=f"XML Syntax Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IRmark computation failure: {str(e)}")

@app.post("/validate-ixbrl", response_model=IxbrlValidationResponse)
def validate_ixbrl_endpoint(req: IxbrlValidationRequest):
    errors = []
    warnings = []
    namespaces_found = []
    
    mandatory_namespaces = [
        "http://www.w3.org/1999/xhtml",
        "http://www.xbrl.org/2013/inlineXBRL",
        "http://www.xbrl.org/uk/fr/gaap/core/2019-01-01",
        "http://xbrl.frc.org.uk/frs/105/2019-01-01"
    ]

    try:
        raw_html = req.ixbrl_html.strip()
        parser = ET.XMLParser(recover=False)
        tree = ET.fromstring(raw_html.encode("utf-8"), parser=parser)
        
        # Check namespaces
        nsmap = tree.nsmap
        for prefix, uri in nsmap.items():
            if uri:
                namespaces_found.append(uri)
                
        missing = [ns for ns in mandatory_namespaces if ns not in namespaces_found]
        if missing:
            errors.append(f"Missing mandatory namespaces: {', '.join(missing)}")

        # Check required tags
        has_turnover = len(tree.xpath('.//*[local-name()="nonFraction" and contains(@name, "TurnoverGrossOperatingRevenue")]')) > 0
        has_share_funds = len(tree.xpath('.//*[local-name()="nonFraction" and contains(@name, "ShareholderFunds")]')) > 0
        has_approval_date = len(tree.xpath('.//*[local-name()="nonNumeric" and contains(@name, "DateApprovalAccounts")]')) > 0
        
        if not has_share_funds:
            errors.append("Mandatory Balance Sheet tag 'uk-gaap:ShareholderFunds' is missing.")
            
        if not has_approval_date:
            errors.append("Mandatory declaration tag 'uk-direp:DateApprovalAccounts' is missing.")

        return IxbrlValidationResponse(
            is_valid_xml=len(errors) == 0,
            namespaces_found=namespaces_found,
            missing_mandatory_namespaces=missing,
            errors=errors,
            warnings=warnings
        )
    except ET.XMLSyntaxError as e:
        return IxbrlValidationResponse(
            is_valid_xml=False,
            namespaces_found=[],
            missing_mandatory_namespaces=mandatory_namespaces,
            errors=[f"XML Parsing Syntax Error: {str(e)}"],
            warnings=[]
        )

