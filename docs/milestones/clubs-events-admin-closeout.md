# Clubs + Events + Admin Milestone Closeout

## Deferred Item

- Join-request approve/reject notifications are currently deferred.
- Current state: workflow is implemented in `app/Services/ClubService.php` via `approveMembership()` and `rejectMembership()`, but no `App\Notifications` classes are present yet and no notification dispatch is wired.
- Follow-up for Payments milestone handoff: implement notifications to membership applicants for approve/reject outcomes.
