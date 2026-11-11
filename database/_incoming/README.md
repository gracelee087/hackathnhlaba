# _incoming - live ingestion demo

This folder holds a document that is NOT in `manifest.json`: the draft of Credit Policy v3 (valid from 2027-01-01, supersedes v2). It is used in the demo to show that a newly ingested document supersedes the current policy and changes the answers (four-eyes limit EUR 1.5 million -> EUR 2.0 million, minimum DSCR 1.20 -> 1.25, ESG questionnaire from EUR 1.0 million).

Run from the `database/` folder while the RAG service is up on port 8001:

```bash
curl -X POST http://localhost:8001/ingest -F "file=@_incoming/Credit_Policy_2027_v3_DRAFT.md" -F "doc_id=credit-policy-2027-v3" -F "title=Credit Policy for Corporate Customers (Version 3) - DRAFT" -F "doc_type=policy" -F "version=v3" -F "valid_from=2027-01-01" -F "supersedes=credit-policy-2025-v2" -F "owner=Risk Management" -F "language=en"
```

After ingestion, ask "Up to which amount can the relationship manager and the credit analyst decide together?" and compare the answer with and without a date filter: before 2027-01-01 the v2 limit (EUR 1.5 million) applies, from 2027-01-01 the v3 draft (EUR 2.0 million).

Synthetic demo document for the FUTURY Build Days #4 Knowledge Transfer challenge. MainBank AG, its customers and all figures are invented.
