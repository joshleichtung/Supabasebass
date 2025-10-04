-- Seed a default room and transport
insert into rooms (id, name) values (gen_random_uuid(), 'YC') returning id \gset
insert into transport (room_id, bpm, key_root, scale_mode, is_playing)
values (:id, 90, 'C', 'ionian', true);
