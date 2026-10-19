USE charityevents_db;

SELECT e.event_id, e.event_name, c.category_name, e.event_date,
       e.current_amount, e.goal_amount,
       ROUND(e.current_amount / NULLIF(e.goal_amount, 0) * 100, 1) AS progress_percent
FROM events e
JOIN categories c ON e.category_id = c.category_id
WHERE e.is_suspended = 0 AND e.event_date >= CURDATE()
ORDER BY e.event_date;
