# -*- coding: utf-8 -*-
"""
A3 ERD for charityevents_db.
Extends the A2 schema with:
  * events.latitude / events.longitude (Open-Meteo weather API)
  * a new registrations table (one user can register for many events;
    one registration per event per email -> UNIQUE(event_id,email)).
Relationships: organisations 1--N events, categories 1--N events,
               events 1--N registrations.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 2300, 1200
IMG = Image.new('RGB', (W, H), '#f6f4ef')
D = ImageDraw.Draw(IMG)
FP, FB = 'C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/arialbd.ttf'


def font(size, bold=False):
    return ImageFont.truetype(FB if bold else FP, size)


def chip(x, y, text, fill, fg):
    D.rounded_rectangle((x, y, x + 34, y + 24), radius=6, fill=fill)
    f = font(11, True)
    D.text((x + 17 - D.textlength(text, font=f) / 2, y + 10), text, font=f, fill=fg)


def entity(x, y, name, cols, w, header):
    h = 40 + 30 * len(cols)
    D.rounded_rectangle((x, y, x + w, y + h), radius=12, fill='#fff', outline='#c9d6d4', width=2)
    D.rounded_rectangle((x, y, x + w, y + 40), radius=12, fill=header)
    D.rectangle((x, y + 22, x + w, y + 40), fill=header)
    D.text((x + 14, y + 12), name, font=font(15, True), fill='#fff')
    yy = y + 46
    for col, kind in cols:
        D.text((x + 14, yy + 5), col, font=font(13), fill='#1d2b36')
        if kind == 'PK':
            chip(x + w - 46, yy + 4, 'PK', '#f6c445', '#3a2f00')
        elif kind == 'FK':
            chip(x + w - 46, yy + 4, 'FK', '#9cc7e8', '#0b3d66')
        elif kind == 'UQ':
            chip(x + w - 46, yy + 4, 'UQ', '#d8b4fe', '#3b0764')
        yy += 30
    return (x, y, x + w, y + h)


org = entity(80, 240, 'organisations', [
    ('organisation_id', 'PK'), ('name', ''), ('description', ''), ('email', ''),
    ('phone', ''), ('address', ''), ('city', ''), ('founded_year', ''),
], 360, '#0e7a6b')

cat = entity(80, 800, 'categories', [
    ('category_id', 'PK'), ('category_name', ''), ('description', ''),
], 360, '#0e7a6b')

eve = entity(860, 120, 'events', [
    ('event_id', 'PK'), ('organisation_id', 'FK'), ('category_id', 'FK'),
    ('event_name', ''), ('event_description', ''), ('purpose', ''),
    ('event_date', ''), ('start_time', ''), ('end_time', ''),
    ('location', ''), ('city', ''), ('latitude', ''),
    ('longitude', ''), ('ticket_price', ''), ('goal_amount', ''),
    ('current_amount', ''), ('image_url', ''), ('is_suspended', ''),
], 580, '#c4622c')

reg = entity(1720, 250, 'registrations  (A3 new)', [
    ('registration_id', 'PK'), ('event_id', 'FK'), ('first_name', ''),
    ('last_name', ''), ('email', ''), ('phone', ''),
    ('ticket_count', ''), ('total_amount', ''), ('registered_at', ''),
], 520, '#3949ab')


def relation(a, b, label, col_a='#0a5f5e', col_b='#c4622c'):
    am = (a[1] + a[3]) / 2
    bm = (b[1] + b[3]) / 2
    D.line((a[2], am, b[0], bm), fill='#55636e', width=3)
    D.text((a[2] + 10, am - 26), '1', font=font(14, True), fill=col_a)
    D.text((b[0] - 26, bm - 26), 'N', font=font(14, True), fill=col_b)
    for dy in (-8, 0, 8):
        D.line((b[0] - 14, bm + dy, b[0], bm), fill=col_b, width=3)
    D.text(((a[2] + b[0]) / 2 - 60, min(am, bm) - 54), label, font=font(13, True), fill='#55636e')


relation(org, eve, 'hosts')
relation(cat, eve, 'classifies')
relation(eve, reg, 'has', col_b='#3949ab')

D.text((80, 60), 'charityevents_db - Entity Relationship Diagram (Assignment 3)',
       font=font(27, True), fill='#0a5f5e')
D.text((80, 112), 'organisations 1--N events ;  categories 1--N events ;  events 1--N registrations',
       font=font(15), fill='#55636e')
D.text((1720, 620), 'UNIQUE(event_id, email): one email may register once per event;',
       font=font(13, True), fill='#3949ab')
D.text((1720, 644), 'FK ON DELETE RESTRICT blocks deleting an event with registrations.',
       font=font(13, True), fill='#3949ab')
D.text((80, 1110), 'PROG2002 Assignment 3 - HeartBridge Charity Events (Liuzhou case study)',
       font=font(12), fill='#8a979e')

OUT = r'C:\Users\30758\Doubao\chats\2026-10-04\new-chat\PROG2002-A3\docs\erd.png'
IMG.save(OUT)
print('ERD saved:', OUT)
