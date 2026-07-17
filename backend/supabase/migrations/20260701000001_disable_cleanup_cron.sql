-- Disable the automatic cleanup cron job. It was deleting print_batches (and
-- cascading print_jobs) after 1h, which conflicted with the admin dashboard's
-- history view showing recent batches.
select cron.unschedule('fotozada-cleanup');
