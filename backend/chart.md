# SemesterSwap System Audit Report

**Date:** 19/2/2026, 6:44:24 pm
**Total Checks:** 10
**Summary:** 10 Passed, 0 Failed

| Category | Description | Status | Details |
| :--- | :--- | :---: | :--- |
| **Functional** | Create Book with Image | ✅ | Book created successfully |
| **Functional** | Enforce Mandatory Image | ✅ | Rejected no-image upload |
| **Security** | Normal User access SuperAdmin Route | ✅ | Access Forbidden 403 |
| **Security** | Admin access SuperAdmin Route | ✅ | Access Forbidden 403 |
| **Functional** | SuperAdmin access SuperAdmin Route | ✅ | Access Granted |
| **Security** | IDOR - Delete Others Book | ✅ | Prevented unauthorized deletion |
| **Logic** | Approve Listing | ✅ | Listing approved |
| **Data Consistency** | Book Status Update | ✅ | Status is approved |
| **Functional** | View User Profile | ✅ | Profile accessible |
| **Privacy** | Profile Email Exposure | ✅ | Email hidden in profile |

## Detailed Findings

🎉 **All systems go! No critical issues found.**
