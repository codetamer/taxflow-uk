import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, compute_irmark_endpoint, validate_ixbrl_endpoint, IRmarkRequest, IxbrlValidationRequest

class TestValidatorSidecar(unittest.TestCase):
    def test_health_check(self):
        from app import health_check
        res = health_check()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["service"], "validator-sidecar")

    def test_compute_irmark(self):
        sample_xml = """<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope">
            <Body>
                <IRmark Type="generic">OldToStrip=</IRmark>
                <CompanyTaxReturn xmlns="http://www.govtalk.gov.uk/taxation/CT/3">
                    <CompanyDetails>
                        <CRN>15152081</CRN>
                        <Name>DROPLOGICX LTD</Name>
                    </CompanyDetails>
                    <Totals>
                        <Profit>31900</Profit>
                        <Tax>6061</Tax>
                    </Totals>
                </CompanyTaxReturn>
            </Body>
        </GovTalkMessage>"""

        req = IRmarkRequest(xml_payload=sample_xml)
        res = compute_irmark_endpoint(req)
        
        self.assertIsNotNone(res.irmark_base64)
        self.assertTrue(len(res.irmark_base64) >= 24)
        self.assertNotIn("OldToStrip", res.canonical_body_xml)
        self.assertIn("DROPLOGICX LTD", res.canonical_body_xml)
        self.assertIn("<Body", res.canonical_body_xml)

    def test_validate_ixbrl(self):
        valid_ixbrl = """<?xml version="1.0" encoding="UTF-8"?>
        <html xmlns="http://www.w3.org/1999/xhtml"
              xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
              xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
              xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
              xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01">
            <body>
                <ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" unitRef="GBP">100000</ix:nonFraction>
                <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP">31139</ix:nonFraction>
                <ix:nonNumeric name="uk-direp:DateApprovalAccounts">2026-10-15</ix:nonNumeric>
            </body>
        </html>"""

        req = IxbrlValidationRequest(ixbrl_html=valid_ixbrl)
        res = validate_ixbrl_endpoint(req)
        
        self.assertTrue(res.is_valid_xml)
        self.assertEqual(len(res.missing_mandatory_namespaces), 0)
        self.assertEqual(len(res.errors), 0)

if __name__ == '__main__':
    unittest.main()
