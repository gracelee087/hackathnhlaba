# Personas - MainBank AG demo corpus

Synthetic demo document for the FUTURY Build Days #4 Knowledge Transfer challenge. MainBank AG, its customers and all figures are invented.

## The bank

MainBank AG, Frankfurt am Main, is a regional bank. The corpus covers its Corporate Banking for small and mid-sized companies (Mittelstand) in the Rhein-Main area. Every credit decision needs a "Markt" vote (relationship manager) and a "Marktfolge" vote (credit analyst). Cases live in KreditPortal; ratings come from RatingTool (1 = best, 10 = default).

## People

| Person | Role | Department key |
|---|---|---|
| Dr. Petra Hoffmann | Senior Credit Analyst, 18 years at MainBank, leaving 2026-12-31. The leaving expert whose knowledge the demo captures. | credit_analysis |
| Stefan Krüger | Head of Credit Analysis, Petra's manager. Decides up to EUR 5.0 million total exposure. Approver for credit_analysis and other. | credit_analysis |
| Claudia Weber | Head of Corporate Banking. Approver for corporate_banking. | corporate_banking |
| Martin Scholz | Relationship Manager for Müller Maschinenbau and Schmidt Logistik. | corporate_banking |
| Daniel Fischer | Relationship Manager for GreenPower Solutions. | corporate_banking |
| Dr. Katrin Lorenz | Head of Risk Management (CRO). Signs policy exceptions (EXC-REQ). Approver for risk_management. | risk_management |
| Jochen Richter | Member of the Management Board, chairs the Credit Committee. Approver for credit_committee. | credit_committee |
| Sabine Neumann | Head of Loan Operations: contracts, collateral registration, disbursement. Approver for loan_operations. | loan_operations |
| Felix Brandt | Petra's successor, Credit Analyst, 4 years at another bank, starts 2026-12-01. | credit_analysis |

## Customers

**Müller Maschinenbau GmbH, Wetzlar.** Special-purpose machines for the automotive supply industry, founded 1979, 85 employees, owner-managed by Thomas Müller (68, succession unresolved). Customer since 2015, rating 3, total exposure EUR 4.3 million after the EUR 2.5 million CNC loan of 2026-09-15. Seasonal liquidity: a 20-30% dip in Q2 and Q3 every year, covered by the EUR 0.8 million working-capital line. Pending: EUR 500,000 seasonal bridge, FY2025 statements still missing.

**Schmidt Logistik GmbH, Hanau.** Road transport and contract logistics, 120 employees, 95 trucks, managing directors Anja and Peter Schmidt. Customer since 2019, rating 5, total exposure EUR 1.8 million. Customer concentration: top three customers are 71% of revenue (Hessenfood AG 38%). The 2025 truck loan needed exception EXC-REQ-2025-014 (equity ratio 19%, LTV 80%), approved with four conditions and explicitly not a precedent.

**GreenPower Solutions GmbH, Darmstadt.** Developer and operator of solar parks, founded 2018, 32 employees, managing director Dr. Lea Winter. Customer since 2023, rating 4, total exposure EUR 4.0 million (project loan "Odenwald-Süd", 15 years, 24-month grace period, decided by the Credit Committee on 2026-03-24). A second park "Wetterau" (EUR 3.5 million, total EUR 7.5 million) is pending at the Credit Committee, which asked for sensitivities on 2026-10-20.
