import math
price_gross = 49.00
def stripe(p, pct=0.015, fixed=0.20): return p*pct+fixed   # ASSUMPTION: standard UK card pricing, verify

print("Original v3 claim check: (49-1.84)/49 =", round((49-1.84)/49*100,2), "%  contribution", round(49-1.84,2))
print("Original breakeven: 1652/47.16 =", round(1652/47.16,3), "-> customers needed:", math.ceil(1652/47.16))
print()
# Scenarios: VAT treatment x variable cost x fixed cost. All illustrative inputs, flagged as such in the PRD.
for vat_label, net in (("VAT-exempt vendor (below threshold), 49 net", 49.00), ("49 is VAT-inclusive, 20% VAT remitted", 49/1.2)):
    print(vat_label, "-> net revenue per filing", round(net,2))
    for var_label, other_var in (("lean other-variable 1.00", 1.00), ("with support time 5.00", 5.00), ("heavy support 10.00", 10.00)):
        contrib = net - stripe(49.0) - other_var
        for fixed_label, fixed in (("fixed 1,652 (v3)", 1652), ("fixed 6,000 (placeholder incl pen test, PI)", 6000), ("fixed 12,000 (placeholder, part-time support)", 12000)):
            be = math.ceil(fixed/contrib)
            print(f"   {var_label:26s} contrib {contrib:6.2f} | {fixed_label:46s} breakeven {be:4d}")
    print()
# CAC payback
contrib = 49/1.2 - stripe(49.0) - 5.00
for cac in (0, 15, 30, 60):
    yrs = cac/contrib if contrib>0 else float('inf')
    print(f"CAC {cac:3d}: contribution {contrib:.2f}/yr -> payback {yrs:.2f} filing-years")
# Retention sensitivity: 3-year LTV at contribution with retention r
for r in (0.5, 0.7, 0.85):
    ltv = sum(contrib*(r**k) for k in range(3))
    print(f"retention {r:.2f}: 3-year contribution per acquired customer {ltv:.2f}")
