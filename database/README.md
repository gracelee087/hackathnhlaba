# MainBank AG demo corpus

Synthetic demo document for the FUTURY Build Days #4 Knowledge Transfer challenge. MainBank AG, its customers and all figures are invented.

This folder is the knowledge corpus for the demo: the documents, e-mails and interview notes a leaving senior credit analyst (Dr. Petra Hoffmann) leaves behind at a fictional regional bank. Documents 01-11 exist in English and German (German file = stem + `_DE`, doc_id + `-de`) and are rendered to `pdf/` by `scripts/make_demo_pdfs.py`. E-mails are plain text and ingested as-is. `manifest.json` carries the ingestion metadata, `taxonomy.json` the departments and glossary, and file 18 the interview facts (loaded via POST /facts, not in the manifest).

## Files

| # | File | Language | doc_id |
|---|---|---|---|
| 01 | 01_MainBank_Credit_Policy_2022_v1 (.md, _DE.md) | en, de | credit-policy-2022-v1 (-de) |
| 02 | 02_MainBank_Credit_Policy_2025_v2 (.md, _DE.md) | en, de | credit-policy-2025-v2 (-de) |
| 03 | 03_MainBank_Credit_Processing_Workflow_2024 (.md, _DE.md) | en, de | credit-workflow-2024 (-de) |
| 04 | 04_MainBank_Risk_Assessment_Checklist_2025 (.md, _DE.md) | en, de | risk-checklist-2025 (-de) |
| 05 | 05_MainBank_Escalation_Guidelines_2025 (.md, _DE.md) | en, de | escalation-2025 (-de) |
| 06 | 06_MainBank_Customer_Profile_Mueller_Maschinenbau (.md, _DE.md) | en, de | cust-mueller-profile (-de) |
| 07 | 07_MainBank_Credit_Case_History_Mueller_Maschinenbau (.md, _DE.md) | en, de | cust-mueller-cases (-de) |
| 08 | 08_MainBank_Customer_Profile_Schmidt_Logistik (.md, _DE.md) | en, de | cust-schmidt-profile (-de) |
| 09 | 09_MainBank_Credit_Case_History_Schmidt_Logistik (.md, _DE.md) | en, de | cust-schmidt-cases (-de) |
| 10 | 10_MainBank_Customer_Profile_GreenPower_Solutions (.md, _DE.md) | en, de | cust-greenpower-profile (-de) |
| 11 | 11_MainBank_Credit_Case_History_GreenPower_Solutions (.md, _DE.md) | en, de | cust-greenpower-cases (-de) |
| 12 | 12_Email_2026-10-06_Credit_Review_Mueller_Missing_Statements.txt | en | email-mueller-review-2026-10 |
| 13 | 13_Email_2025-05-12_Risikoeinschaetzung_Schmidt_Klumpenrisiko.txt | de | email-schmidt-concentration-2025-05 |
| 14 | 14_Email_2026-03-18_Credit_Decision_GreenPower_Delayed_Cashflows.txt | en | email-greenpower-decision-2026-03 |
| 15 | 15_Email_2026-09-22_Eskalation_GreenPower_Zweiter_Solarpark.txt | de | email-greenpower-escalation-2026-09 |
| 16 | 16_Email_2025-06-24_Exception_Approval_Schmidt_Equity_Ratio.txt | en | email-schmidt-exception-2025-06 |
| 17 | 17_Email_2026-10-14_Kundenhistorie_Mueller_Wiederholte_Anfragen.txt | de | email-mueller-history-2026-10 |
| 18 | 18_Interview_Petra_Hoffmann_2026-11.json | en | (interview facts, POST /facts) |

## Validity timeline

- **Credit Policy v1** (`credit-policy-2022-v1`): valid from 2022-01-01. Four-eyes up to EUR 1.0 million, Head of Credit Analysis up to EUR 3.0 million, committee above EUR 3.0 million.
- **Credit Policy v2** (`credit-policy-2025-v2`): valid from 2025-07-01, supersedes v1. Four-eyes up to EUR 1.5 million, Head of Credit Analysis up to EUR 5.0 million, committee above EUR 5.0 million.
- **Credit Policy v3 DRAFT** (`credit-policy-2027-v3`): in `_incoming/`, valid from 2027-01-01, not in the manifest. Used for the live ingestion demo (see `_incoming/README.md`).

Credit decisions before 2025-07-01 (Müller 2022 and 2024, Schmidt 2021 and 2025-06-30) were taken under v1; decisions from 2025-07-01 on (GreenPower 2026, Müller 2026) under v2.

Everything in this corpus is fictional: MainBank AG, the people, the customers, the forms, the amounts and the dates are invented for the demo and have no connection to any real bank, company or person.
