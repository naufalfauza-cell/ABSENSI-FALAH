create index if not exists attendance_records_member_id_idx on public.attendance_records(member_id);
create index if not exists attendance_records_session_id_idx on public.attendance_records(session_id);
create index if not exists attendance_records_check_in_location_id_idx on public.attendance_records(check_in_location_id);
create index if not exists attendance_records_check_out_location_id_idx on public.attendance_records(check_out_location_id);
create index if not exists committee_members_division_id_idx on public.committee_members(division_id);
create index if not exists admin_corrections_admin_user_id_idx on public.admin_corrections(admin_user_id);
create index if not exists audit_logs_admin_user_id_idx on public.audit_logs(admin_user_id);
