-- Seed the existing trial database. The same data is also included in the
-- baseline migration for future environments.
insert into service_types (name, name_en, icon, description, is_active, category)
select * from (values
  ('تغيير زيت المحرك', 'Oil Change', 'oil-drop', 'تغيير الزيت والفلتر', true, 'periodic'),
  ('فحص وصيانة دورية', 'Periodic Inspection', 'clipboard-check', 'فحص شامل للسيارة', true, 'periodic'),
  ('عمرة مكينة', 'Engine Overhaul', 'settings', 'إصلاح وعمرة المحرك', true, 'engine'),
  ('إصلاح تسريب زيت', 'Oil Leak Repair', 'droplet', 'معالجة تهريب الزيوت', true, 'engine'),
  ('تغيير زيت القير', 'Transmission Oil Change', 'settings-2', 'صيانة ناقل الحركة', true, 'transmission'),
  ('تغيير كلتش', 'Clutch Replacement', 'disc-3', 'صيانة الكلتش', true, 'transmission'),
  ('تغيير مساعدات', 'Shock Absorbers', 'move-up-down', 'صيانة التعليق', true, 'suspension'),
  ('تغيير فحمات الفرامل', 'Brake Service', 'circle-dot', 'فحص وصيانة الفرامل', true, 'suspension'),
  ('تغيير بطارية', 'Battery Replacement', 'battery', 'بطارية وفحص الشحن', true, 'electrical'),
  ('إصلاح كهرباء السيارة', 'Electrical Repair', 'zap', 'فحص وإصلاح الكهرباء', true, 'electrical'),
  ('تعبئة فريون', 'AC Gas Refill', 'wind', 'خدمة المكيف', true, 'ac'),
  ('إصلاح كمبروسر المكيف', 'AC Compressor Repair', 'fan', 'صيانة مكيف السيارة', true, 'ac'),
  ('سمكرة وإصلاح صدمات', 'Dent Repair', 'hammer', 'إصلاح الهيكل والصدمات', true, 'bodywork'),
  ('دهان سيارات', 'Car Painting', 'palette', 'دهان وتجديد المظهر', true, 'bodywork'),
  ('غسيل داخلي', 'Interior Wash', 'sparkles', 'تنظيف المقصورة', true, 'washing'),
  ('غسيل داخلي وخارجي', 'Full Car Wash', 'waves', 'غسيل وتلميع كامل', true, 'washing'),
  ('ونش وسحب سيارة', 'Tow Truck', 'truck', 'سحب ونقل السيارة', true, 'emergency'),
  ('تغيير إطار طوارئ', 'Emergency Tire Change', 'circle', 'خدمة الإطارات الطارئة', true, 'emergency')
) as catalog(name, name_en, icon, description, is_active, category)
where not exists (select 1 from service_types);
