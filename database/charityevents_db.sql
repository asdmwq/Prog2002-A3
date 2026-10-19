-- =====================================================================
-- PROG2002 Web Development II - Assignment 3
-- charityevents_db : schema + sample data for the HeartBridge charity
-- events website (case study set in Liuzhou, China).
--
-- A3 changes over A2:
--   * events table gains latitude / longitude for the optional Open-Meteo
--     weather forecast on the Event Details page.
--   * new registrations table (which event a user registered for, contact
--     details, ticket count, purchase date) with a unique rule that stops
--     the same person registering for the same event more than once.
--   * 14 sample registrations (>= the required 10).
--   * application account granted SELECT/INSERT/UPDATE/DELETE (full CRUD),
--     but still no DDL.
--
-- MySQL 8.x  /  InnoDB  /  utf8mb4
-- Re-runnable: drops and recreates the database.
-- =====================================================================

DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE charityevents_db;

-- ---------------------------------------------------------------------
-- organisations : the charities that host events
-- ---------------------------------------------------------------------
CREATE TABLE organisations (
    organisation_id INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT NOT NULL,
    email           VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    address         VARCHAR(255),
    city            VARCHAR(80) NOT NULL DEFAULT 'Liuzhou',
    founded_year    INT,
    CONSTRAINT chk_org_year CHECK (founded_year IS NULL OR founded_year BETWEEN 1900 AND 2100)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- categories : reusable event categories
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    category_name   VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- events : public-facing event information
-- ---------------------------------------------------------------------
CREATE TABLE events (
    event_id            INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id     INT NOT NULL,
    category_id         INT NOT NULL,
    event_name          VARCHAR(200) NOT NULL,
    event_description   TEXT NOT NULL,
    purpose             TEXT NOT NULL,
    event_date          DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    location            VARCHAR(200) NOT NULL,
    city                VARCHAR(80) NOT NULL DEFAULT 'Liuzhou',
    ticket_price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    goal_amount         DECIMAL(12,2) NOT NULL,
    current_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    image_url           VARCHAR(500),
    latitude            DECIMAL(9,6) NULL,
    longitude           DECIMAL(9,6) NULL,
    is_suspended        TINYINT(1) NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_org  FOREIGN KEY (organisation_id)
        REFERENCES organisations (organisation_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_events_cat  FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_event_goal    CHECK (goal_amount >= 0),
    CONSTRAINT chk_event_current CHECK (current_amount >= 0),
    CONSTRAINT chk_event_ticket  CHECK (ticket_price >= 0),
    CONSTRAINT chk_event_time    CHECK (end_time > start_time),
    CONSTRAINT chk_event_lat     CHECK (latitude  IS NULL OR (latitude  BETWEEN  -90 AND  90)),
    CONSTRAINT chk_event_lon     CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)),

    INDEX idx_events_date          (event_date),
    INDEX idx_events_location      (location),
    INDEX idx_events_category      (category_id),
    INDEX idx_events_suspended     (is_suspended),
    INDEX idx_events_status_date   (is_suspended, event_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- registrations (A3 new) : a web user's registration for one event.
--
-- There is intentionally no user table. A person is identified by their
-- contact email. The UNIQUE KEY (event_id, email) enforces the business
-- rule "a user may register for many different events, but only once for
-- the same event". The foreign key is ON DELETE RESTRICT so an event
-- that has registrations cannot be deleted from the admin site.
-- ---------------------------------------------------------------------
CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id        INT NOT NULL,
    first_name      VARCHAR(80)  NOT NULL,
    last_name       VARCHAR(80)  NOT NULL,
    email           VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    ticket_count    INT NOT NULL DEFAULT 1,
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    registered_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reg_event FOREIGN KEY (event_id)
        REFERENCES events (event_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_reg_tickets CHECK (ticket_count BETWEEN 1 AND 20),
    CONSTRAINT chk_reg_total   CHECK (total_amount >= 0),
    CONSTRAINT uq_reg_event_email UNIQUE (event_id, email),

    INDEX idx_reg_event  (event_id),
    INDEX idx_reg_email  (email),
    INDEX idx_reg_date   (registered_at)
) ENGINE=InnoDB;

-- =====================================================================
-- Reference data
-- =====================================================================

INSERT INTO organisations
    (name, description, email, phone, address, city, founded_year) VALUES
('HeartBridge Charity Foundation',
 'HeartBridge Charity Foundation is a community charity in Liuzhou that connects caring people with local causes. We organise runs, gala dinners and community markets to raise funds for education, medical relief and neighbourhood support programmes across the city.',
 'contact@heartbridge-lz.org', '+86 772 280 1166',
 '5 Hexi Road, Chengzhong District', 'Liuzhou', 2015),
('Liujiang River Care Association',
 'The Liujiang River Care Association works to protect the Liujiang river environment and promote healthy outdoor living. Our walks, clean-up days and auctions fund river conservation, greenway maintenance and environmental education in local schools.',
 'hello@liujiangcare.cn', '+86 772 285 3399',
 '18 Binjiang East Road', 'Liuzhou', 2012),
('Warm Nest Children''s Charity',
 'Warm Nest Children''s Charity supports children from low-income families in Liuzhou through tutoring, music programmes and community volunteer days that bring families together for a day of learning, play and mutual support.',
 'care@warmnest-lz.org', '+86 772 266 7788',
 '88 Wenhua Road', 'Liuzhou', 2018);

INSERT INTO categories (category_name, description) VALUES
('Fun Run',          'Group running events that combine exercise with fundraising.'),
('Gala Dinner',      'Formal evening dinners with entertainment and fundraising.'),
('Silent Auction',   'Auctions of donated experiences and items for charity.'),
('Charity Concert',  'Music performances raising money for a cause.'),
('Charity Walk',     'Sponsored walks, often in riverside or park settings.'),
('Community Market', 'Bazaars and volunteer days open to the whole community.');

INSERT INTO events
    (organisation_id, category_id, event_name, event_description, purpose,
     event_date, start_time, end_time, location, city,
     ticket_price, goal_amount, current_amount, image_url, latitude, longitude, is_suspended) VALUES
-- 7 upcoming events ----------------------------------------------------
(1, 1, 'Liuzhou Riverside Sunrise Fun Run',
 'A family-friendly charity fun run along the Binjiang Greenway beside the Liujiang River. Participants of all ages can choose a 3 km or 6 km route, enjoy a healthy morning warm-up led by local fitness volunteers, and receive a finisher medal and breakfast box after the race.',
 'Raise funds for after-school education and weekend sports clubs for children in Liuzhou neighbourhoods.',
 '2026-10-25', '08:00', '12:00', 'Binjiang Greenway, Chengzhong District', 'Liuzhou',
 25.00, 15000.00, 9200.00, 'images/fun-run.svg', 24.325600, 109.405000, 0),
(1, 2, 'Moonlit Liujiang Charity Gala',
 'An elegant evening gala featuring a three-course dinner, live traditional music, a keynote story from a supported family, and a fundraising appeal. Guests will sit beside the river as the moon rises over the Binjiang skyline.',
 'Fund scholarships and learning-resource packs for students from low-income families.',
 '2026-10-31', '18:30', '22:30', 'Lotus Villa Hotel Grand Ballroom', 'Liuzhou',
 380.00, 300000.00, 185000.00, 'images/gala.svg', 24.335500, 109.421000, 0),
(3, 6, 'Warm Nest Community Volunteer Day',
 'A community volunteering day with park clean-up activities, sustainability workshops for children, second-hand book and toy stalls, and family games. Everyone is welcome to volunteer for an hour or stay for the whole day.',
 'Support local children and families while strengthening neighbourhood community spirit.',
 '2026-11-07', '09:00', '15:00', "People's Square, Chengzhong District", 'Liuzhou',
 0.00, 10000.00, 6700.00, 'images/community-day.svg', 24.318800, 109.414500, 0),
(3, 4, 'Songs for Warm Nests Charity Concert',
 'A charity music evening featuring local singers, student choirs and community musicians. The programme blends folk songs, popular classics and original pieces written by the children of the Warm Nest music programme.',
 'Fund digital music instruments and concert outings for children in the Warm Nest programme.',
 '2026-11-21', '17:00', '21:00', 'Liuzhou Culture and Art Center Concert Hall', 'Liuzhou',
 45.00, 200000.00, 126000.00, 'images/concert.svg', 24.330200, 109.405800, 0),
(2, 3, 'Hope for Tomorrow Silent Auction',
 'A fundraising auction of donated experiences and items, including river cruises, hotel stays, calligraphy works, crafts and dinner vouchers. Bidding is silent through bid sheets, and all proceeds go to river education.',
 'Provide environmental education workshops in Liuzhou primary schools.',
 '2026-12-05', '13:00', '17:00', 'Liuzhou Museum Exhibition Hall', 'Liuzhou',
 0.00, 80000.00, 31500.00, 'images/auction.svg', 24.326800, 109.423000, 0),
(1, 2, 'Spring Orchid Fundraising Dinner',
 'A fundraising dinner designed to support mentoring and leadership opportunities for young people. The evening includes dinner, mentoring stories, a youth panel and an auction of orchid arrangements donated by local growers.',
 'Fund youth mentoring and leadership programmes in Liuzhou.',
 '2026-12-12', '18:00', '22:00', 'Liugang Hotel Banquet Hall', 'Liuzhou',
 198.00, 250000.00, 148000.00, 'images/fundraiser-dinner.svg', 24.351000, 109.385500, 0),
(2, 5, 'Liujiang Riverside Charity Walk',
 'A sponsored riverside walk through Fenghuanghe Park with rest stops, nature quizzes for children and a closing picnic. Walkers collect sponsorship from friends and family for every kilometre completed.',
 'Fund community wellbeing and volunteer conservation work along the Liujiang River.',
 '2027-01-16', '08:30', '12:30', 'Fenghuanghe Park Riverside Gate', 'Liuzhou',
 30.00, 14000.00, 5200.00, 'images/walk.svg', 24.301500, 109.441000, 0),
-- 2 past events --------------------------------------------------------
(1, 6, 'Mid-Autumn Charity Bazaar',
 'A Mid-Autumn bazaar with handmade craft stalls, mooncake tasting, lantern riddles and children performances. The bazaar welcomed thousands of visitors and exceeded its fundraising goal.',
 'Raise funds for holiday care packages for elderly residents living alone.',
 '2026-09-25', '16:00', '21:30', 'Wenchang Square', 'Liuzhou',
 0.00, 12000.00, 13800.00, 'images/market.svg', 24.320800, 109.412800, 0),
(2, 5, 'Dragon Boat River Clean-up Walk',
 'A riverside clean-up walk held around the Dragon Boat Festival, where volunteers removed litter along 6 km of riverbank and learned about water quality from environmental scientists.',
 'Protect the Liujiang river environment and demonstrate community conservation in action.',
 '2026-06-13', '08:00', '13:00', 'Binjiang East Riverbank', 'Liuzhou',
 0.00, 8000.00, 9050.00, 'images/walk.svg', 24.310500, 109.436000, 0),
-- 1 suspended event ----------------------------------------------------
(3, 1, 'Winter Warm-up Fun Run (postponed)',
 'A winter fun run that has been postponed while the organising committee reviews the route and safety plan. The event remains stored in the database but is suspended and must not appear on public pages.',
 'Winter warmth packs for children, to be launched when the event is rescheduled.',
 '2026-12-20', '09:00', '12:00', 'Longtan Park Main Gate', 'Liuzhou',
 20.00, 20000.00, 0.00, 'images/fun-run.svg', 24.288000, 109.426500, 1);

-- =====================================================================
-- Registrations (>= 10). total_amount = ticket_price * ticket_count.
-- Distinct purchase dates so the details page can sort latest-first.
-- =====================================================================
INSERT INTO registrations
    (event_id, first_name, last_name, email, phone, ticket_count, total_amount, registered_at) VALUES
-- Event 1 - Liuzhou Riverside Sunrise Fun Run (¥25)
(1, 'Mei',  'Lin',  'meilin@example.com',    '138 0000 0001', 2, 50.00,  '2026-10-02 09:14:00'),
(1, 'Tao',  'Zhang','tao.zhang@example.com', '138 0000 0002', 3, 75.00,  '2026-10-05 19:41:00'),
(1, 'Fang', 'Liu',  'fang.liu@example.com',  '138 0000 0003', 1, 25.00,  '2026-10-09 08:05:00'),
(1, 'Jie',  'Chen', 'jie.chen@example.com',  '138 0000 0004', 2, 50.00,  '2026-10-11 20:30:00'),
-- Event 2 - Moonlit Liujiang Charity Gala (¥380)
(2, 'Yan',  'Wang', 'yan.wang@example.com',  '138 0000 0005', 2, 760.00, '2026-10-04 10:22:00'),
(2, 'Bo',   'Li',   'bo.li@example.com',     '138 0000 0006', 1, 380.00, '2026-10-08 21:10:00'),
-- Event 3 - Warm Nest Community Volunteer Day (free)
(3, 'Ning', 'Zhou', 'ning.zhou@example.com', '138 0000 0007', 2, 0.00,   '2026-10-06 15:00:00'),
(3, 'Rui',  'Xu',   'rui.xu@example.com',    '138 0000 0008', 4, 0.00,   '2026-10-10 11:48:00'),
-- Event 4 - Songs for Warm Nests Charity Concert (¥45)
(4, 'Qing', 'Zhao', 'qing.zhao@example.com', '138 0000 0009', 2, 90.00,  '2026-10-07 16:30:00'),
(4, 'Min',  'Sun',  'min.sun@example.com',   '138 0000 0010', 4, 180.00, '2026-10-12 09:55:00'),
-- Event 5 - Hope for Tomorrow Silent Auction (free)
(5, 'Hui',  'Ma',   'hui.ma@example.com',    '138 0000 0011', 1, 0.00,   '2026-10-03 14:12:00'),
-- Event 6 - Spring Orchid Fundraising Dinner (¥198)
(6, 'Hao',  'Wu',   'hao.wu@example.com',    '138 0000 0012', 1, 198.00, '2026-10-01 18:20:00'),
(6, 'Lei',  'Yang', 'lei.yang@example.com',  '138 0000 0013', 2, 396.00, '2026-10-10 17:40:00'),
-- Event 8 - Mid-Autumn Charity Bazaar (free, past)
(8, 'Juan', 'Deng', 'juan.deng@example.com', '138 0000 0014', 2, 0.00,   '2026-09-10 10:00:00');

-- =====================================================================
-- Least-privilege application account.
-- A3 needs full DML for CRUD: SELECT / INSERT / UPDATE / DELETE on data
-- tables only (no DDL, no GRANT).
-- =====================================================================
DROP USER IF EXISTS 'event_user'@'localhost';
CREATE USER 'event_user'@'localhost' IDENTIFIED BY 'event_pass_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON charityevents_db.* TO 'event_user'@'localhost';
FLUSH PRIVILEGES;

-- Verification queries (optional, run manually):
-- SELECT COUNT(*) AS total_events FROM events;
-- SELECT COUNT(*) AS total_registrations FROM registrations;
-- SELECT e.event_name, COUNT(r.registration_id) AS regs, COALESCE(SUM(r.ticket_count),0) AS tickets
--   FROM events e LEFT JOIN registrations r ON r.event_id = e.event_id
--  GROUP BY e.event_id ORDER BY e.event_date;
