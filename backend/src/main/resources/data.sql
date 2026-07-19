-- Seed data - only inserts if tables are empty

INSERT INTO service_types (name, name_en, icon, description, is_active, category)
SELECT * FROM (
  SELECT 'تغيير زيت المحرك', 'Oil Change', 'oil-drop', 'تغيير زيت المحرك مع فلتر الزيت', true, 'periodic' UNION ALL
  SELECT 'تغيير فلتر الهواء', 'Air Filter Replacement', 'air-filter', 'تغيير فلتر هواء المحرك', true, 'periodic' UNION ALL
  SELECT 'تغيير فلتر المكيف', 'Cabin Filter Replacement', 'ac-filter', 'تغيير فلتر هواء المكيف', true, 'periodic' UNION ALL
  SELECT 'تغيير شمعات الاحتراق', 'Spark Plugs Replacement', 'spark-plug', 'تغيير بوجيات المحرك', true, 'periodic' UNION ALL
  SELECT 'تغيير زيت القير', 'Transmission Oil Change', 'gearbox-oil', 'تغيير زيت ناقل الحركة', true, 'periodic' UNION ALL
  SELECT 'تغيير زيت الفرامل', 'Brake Fluid Change', 'brake-fluid', 'تغيير زيت الفرامل', true, 'periodic' UNION ALL
  SELECT 'تغيير ماء الردياتير', 'Coolant Change', 'coolant', 'تغيير ماء التبريد', true, 'periodic' UNION ALL
  SELECT 'فحص دوري شامل', 'Periodic Inspection', 'inspection', 'فحص شامل للسيارة', true, 'periodic' UNION ALL
  SELECT 'تغيير سير المكينة', 'Serpentine Belt Replacement', 'belt', 'تغيير سير المكينة', true, 'periodic' UNION ALL
  SELECT 'تغيير فلتر البنزين', 'Fuel Filter Replacement', 'fuel-filter', 'تغيير فلتر الوقود', true, 'periodic' UNION ALL
  SELECT 'عمرة مكينة', 'Engine Overhaul', 'engine-overhaul', 'عمرة كاملة للمحرك', true, 'engine' UNION ALL
  SELECT 'تغيير وجه سلندر', 'Head Gasket Replacement', 'head-gasket', 'تغيير وجه السلندر', true, 'engine' UNION ALL
  SELECT 'تغيير طرمبة الزيت', 'Oil Pump Replacement', 'oil-pump', 'تغيير طرمبة الزيت', true, 'engine' UNION ALL
  SELECT 'تغيير طرمبة الماء', 'Water Pump Replacement', 'water-pump', 'تغيير طرمبة الماء', true, 'engine' UNION ALL
  SELECT 'تغيير كراسي المكينة', 'Engine Mounts Replacement', 'engine-mount', 'تغيير كراسي المكينة', true, 'engine' UNION ALL
  SELECT 'تغيير ديناميكيات المكينة', 'Engine Timing Service', 'timing', 'تغيير ديناميكيات المكينة', true, 'engine' UNION ALL
  SELECT 'إصلاح تسريبات زيت', 'Oil Leak Repair', 'oil-leak', 'إصلاح تسريبات زيت المحرك', true, 'engine' UNION ALL
  SELECT 'تنظيف البخاخات', 'Fuel Injector Cleaning', 'injector', 'تنظيف بخاخات الوقود', true, 'engine' UNION ALL
  SELECT 'تغيير حساس الأكسجين', 'O2 Sensor Replacement', 'o2-sensor', 'تغيير حساس الأكسجين', true, 'engine' UNION ALL
  SELECT 'تغيير طرمبة البنزين', 'Fuel Pump Replacement', 'fuel-pump', 'تغيير طرمبة البنزين', true, 'engine' UNION ALL
  SELECT 'عمرة قير أوتوماتيك', 'Automatic Transmission Overhaul', 'auto-gearbox', 'عمرة قير أوتوماتيك', true, 'transmission' UNION ALL
  SELECT 'عمرة قير عادي', 'Manual Transmission Overhaul', 'manual-gearbox', 'عمرة قير يدوي', true, 'transmission' UNION ALL
  SELECT 'تغيير كلتش', 'Clutch Replacement', 'clutch', 'تغيير طقم الكلتش', true, 'transmission' UNION ALL
  SELECT 'تغيير دبل', 'Transfer Case Service', 'transfer-case', 'صيانة الدبل', true, 'transmission' UNION ALL
  SELECT 'تغيير زيت الدفرنس', 'Differential Oil Change', 'differential', 'تغيير زيت الدفرنس', true, 'transmission' UNION ALL
  SELECT 'تغيير عمود كردان', 'Driveshaft Replacement', 'driveshaft', 'تغيير عمود الكردان', true, 'transmission' UNION ALL
  SELECT 'تغيير مساعدات', 'Shock Absorbers Replacement', 'shock', 'تغيير المساعدات الأمامية والخلفية', true, 'suspension' UNION ALL
  SELECT 'تغيير يايات', 'Springs Replacement', 'spring', 'تغيير اليايات', true, 'suspension' UNION ALL
  SELECT 'تغيير جلنط', 'Ball Joint Replacement', 'ball-joint', 'تغيير الجلنط', true, 'suspension' UNION ALL
  SELECT 'تغيير ذراع سفلي', 'Control Arm Replacement', 'control-arm', 'تغيير الذراع السفلي', true, 'suspension' UNION ALL
  SELECT 'تغيير مقصات', 'Tie Rods Replacement', 'tie-rod', 'تغيير المقصات', true, 'suspension' UNION ALL
  SELECT 'تغيير اكسس', 'Axle Replacement', 'axle', 'تغيير الاكسس', true, 'suspension' UNION ALL
  SELECT 'تغيير فرامل أمامية', 'Front Brakes Replacement', 'brake-front', 'تغيير فرامل أمامية (بان + قماش)', true, 'suspension' UNION ALL
  SELECT 'تغيير فرامل خلفية', 'Rear Brakes Replacement', 'brake-rear', 'تغيير فرامل خلفية', true, 'suspension' UNION ALL
  SELECT 'تغيير طرمبة فرامل', 'Brake Master Pump Replacement', 'brake-pump', 'تغيير طرمبة الفرامل', true, 'suspension' UNION ALL
  SELECT 'تغيير اسطوانات فرامل', 'Brake Cylinder Replacement', 'brake-cylinder', 'تغيير اسطوانات الفرامل', true, 'suspension' UNION ALL
  SELECT 'تغيير دينمو', 'Alternator Replacement', 'alternator', 'تغيير دينمو السيارة', true, 'electrical' UNION ALL
  SELECT 'تغيير سلف', 'Starter Replacement', 'starter', 'تغيير سلف السيارة', true, 'electrical' UNION ALL
  SELECT 'تغيير بطارية', 'Battery Replacement', 'battery', 'تغيير بطارية السيارة', true, 'electrical' UNION ALL
  SELECT 'تغيير كويل', 'Ignition Coil Replacement', 'coil', 'تغيير كويل الاشعال', true, 'electrical' UNION ALL
  SELECT 'برمجة كمبيوتر', 'ECU Programming', 'ecu', 'برمجة كمبيوتر السيارة', true, 'electrical' UNION ALL
  SELECT 'تغيير حساسات', 'Sensors Replacement', 'sensor', 'تغيير جميع أنواع الحساسات', true, 'electrical' UNION ALL
  SELECT 'إصلاح أسواريم', 'Wiring Repair', 'wiring', 'إصلاح الأسواريم الكهربائية', true, 'electrical' UNION ALL
  SELECT 'تغيير لمبات', 'Bulbs Replacement', 'bulb', 'تغيير لمبات السيارة', true, 'electrical' UNION ALL
  SELECT 'تركيب نظام صوت', 'Audio System Installation', 'audio', 'تركيب مسجل وسماعات', true, 'electrical' UNION ALL
  SELECT 'تركيب إنذار', 'Alarm Installation', 'alarm', 'تركيب نظام إنذار', true, 'electrical' UNION ALL
  SELECT 'شحن فلور', 'AC Gas Refill', 'ac-gas', 'شحن فلور المكيف', true, 'ac' UNION ALL
  SELECT 'تغيير كمبروسر', 'AC Compressor Replacement', 'ac-compressor', 'تغيير كمبروسر المكيف', true, 'ac' UNION ALL
  SELECT 'تغيير ثرمستات', 'Thermostat Replacement', 'thermostat', 'تغيير الثرمستات', true, 'ac' UNION ALL
  SELECT 'تغيير مروحة ردياتير', 'Radiator Fan Replacement', 'radiator-fan', 'تغيير مروحة الردياتير', true, 'ac' UNION ALL
  SELECT 'تغيير ردياتير', 'Radiator Replacement', 'radiator', 'تغيير ردياتير الماء', true, 'ac' UNION ALL
  SELECT 'تغيير طرمبة مكيف', 'AC Pump Replacement', 'ac-pump', 'تغيير طرمبة المكيف', true, 'ac' UNION ALL
  SELECT 'غسيل ردياتير', 'Radiator Flush', 'radiator-flush', 'غسيل ردياتير المكيف', true, 'ac' UNION ALL
  SELECT 'تغيير مبخر', 'AC Evaporator Replacement', 'ac-evaporator', 'تغيير مبخر المكيف', true, 'ac' UNION ALL
  SELECT 'سمكرة', 'Dent Repair', 'dent', 'سمكرة وإصلاح الصدامات', true, 'bodywork' UNION ALL
  SELECT 'دوكو', 'Painting', 'paint', 'دهان أجزاء السيارة', true, 'bodywork' UNION ALL
  SELECT 'دهان كامل', 'Full Paint Job', 'full-paint', 'دهان السيارة كاملة', true, 'bodywork' UNION ALL
  SELECT 'معجون', 'Body Filler', 'filler', 'معجون سمكرة', true, 'bodywork' UNION ALL
  SELECT 'تلميع سيارات', 'Car Polishing', 'polish', 'تلميع السيارة', true, 'bodywork' UNION ALL
  SELECT 'إصلاح زجاج', 'Glass Repair', 'glass', 'إصلاح أو تغيير زجاج السيارة', true, 'bodywork' UNION ALL
  SELECT 'تظليل', 'Window Tinting', 'tint', 'تظليل زجاج السيارة', true, 'bodywork' UNION ALL
  SELECT 'ونش سحاب', 'Tow Truck', 'tow', 'خدمة الونش وسحب السيارات المتعطلة', true, 'emergency' UNION ALL
  SELECT 'تغيير إطار', 'Tire Change', 'tire', 'تغيير إطار السيارة', true, 'emergency' UNION ALL
  SELECT 'بنزين طوارئ', 'Emergency Fuel', 'fuel', 'توصيل بنزين للطوارئ', true, 'emergency' UNION ALL
  SELECT 'فتح باب', 'Car Unlock', 'unlock', 'فتح باب السيارة المقفول', true, 'emergency' UNION ALL
  SELECT 'شحن بطارية', 'Battery Jump Start', 'jump-start', 'شحن بطارية السيارة', true, 'emergency' UNION ALL
  SELECT 'ترحيل سيارة', 'Car Transport', 'transport', 'ترحيل السيارة', true, 'emergency'
) tmp WHERE NOT EXISTS (SELECT 1 FROM service_types);

INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type)
SELECT * FROM (
  SELECT 'ورشة الخبراء', 'أحمد محمد', '0501111111', 'expert@workshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'الرياض - حي النهضة', 'الرياض', 'صيانة دورية,مكينة,قير,كهرباء', 4.5, true, true, 'stationary' UNION ALL
  SELECT 'ورشة التقنية', 'خالد عبدالله', '0502222222', 'tech@workshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'جدة - حي السلامة', 'جدة', 'سمكرة,دهان,تكييف,كهرباء', 4.2, true, true, 'stationary' UNION ALL
  SELECT 'ورشة المتقن', 'سامي علي', '0503333333', 'master@workshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'الدمام - حي العدامة', 'الدمام', 'صيانة دورية,مكينة,قير', 4.8, true, true, 'stationary' UNION ALL
  SELECT 'ورشة الصيانة السريعة', 'فهد عمر', '0504444444', 'quick@workshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'مكة - حي العزيزية', 'مكة', 'صيانة دورية,كهرباء,تكييف', 4.0, true, true, 'mobile' UNION ALL
  SELECT 'ورشة الإتقان', 'ناصر حسن', '0505555555', 'itqan@workshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'المدينة - حي العوالي', 'المدينة المنورة', 'سمكرة,دهان,ونش سحاب', 4.6, true, true, 'stationary'
) tmp ON CONFLICT DO NOTHING;


