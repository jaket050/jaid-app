-- One-time fix: four vehicle words were filed under Land. Move them to
-- Vehicles, joining id 321 (båsnbus). Run after the Kumision import.
-- Safe to run once in the Supabase SQL editor; the category guard makes a
-- second run a no-op.
--
--   322 kareta          Car
--   323 bisikleta       Bicycle
--   324 motusaikot      Motorcycle
--   325 karetan karabåo Carabao cart

UPDATE vocabulary SET category = 'Vehicles'
WHERE id IN (322, 323, 324, 325) AND category = 'Land';
