-- Seed a default room and transport
with new_room as (
  insert into rooms (id, name) values (gen_random_uuid(), 'YC') returning id
)
insert into transport (room_id, bpm, key_root, scale_mode, is_playing)
select id, 90, 'C', 'ionian', true from new_room;
