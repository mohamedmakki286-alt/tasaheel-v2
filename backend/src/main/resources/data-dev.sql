-- Seed data for H2 dev database
-- Tables are created by Hibernate ddl-auto=create-drop before this runs

-- ============================================
-- Service Types (الخدمات)
-- ============================================
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير زيت المحرك', 'Oil Change', 'oil-drop', 'تغيير زيت المحرك مع فلتر الزيت', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير فلتر الهواء', 'Air Filter Replacement', 'air-filter', 'تغيير فلتر هواء المحرك', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير فلتر المكيف', 'Cabin Filter Replacement', 'ac-filter', 'تغيير فلتر هواء المكيف', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير شمعات الاحتراق', 'Spark Plugs Replacement', 'spark-plug', 'تغيير بوجيات المحرك', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير زيت القير', 'Transmission Oil Change', 'gearbox-oil', 'تغيير زيت ناقل الحركة', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير زيت الفرامل', 'Brake Fluid Change', 'brake-fluid', 'تغيير زيت الفرامل', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير ماء الردياتير', 'Coolant Change', 'coolant', 'تغيير ماء التبريد', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('فحص دوري شامل', 'Periodic Inspection', 'inspection', 'فحص شامل للسيارة', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير سير المكينة', 'Serpentine Belt Replacement', 'belt', 'تغيير سير المكينة', true, 'periodic');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير فلتر البنزين', 'Fuel Filter Replacement', 'fuel-filter', 'تغيير فلتر الوقود', true, 'periodic');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('عمرة مكينة', 'Engine Overhaul', 'engine-overhaul', 'عمرة كاملة للمحرك', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير وجه سلندر', 'Head Gasket Replacement', 'head-gasket', 'تغيير وجه السلندر', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير طرمبة الزيت', 'Oil Pump Replacement', 'oil-pump', 'تغيير طرمبة الزيت', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير طرمبة الماء', 'Water Pump Replacement', 'water-pump', 'تغيير طرمبة الماء', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير كراسي المكينة', 'Engine Mounts Replacement', 'engine-mount', 'تغيير كراسي المكينة', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير ديناميكيات المكينة', 'Engine Timing Service', 'timing', 'تغيير ديناميكيات المكينة', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('إصلاح تسريبات زيت', 'Oil Leak Repair', 'oil-leak', 'إصلاح تسريبات زيت المحرك', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تنظيف البخاخات', 'Fuel Injector Cleaning', 'injector', 'تنظيف بخاخات الوقود', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير حساس الأكسجين', 'O2 Sensor Replacement', 'o2-sensor', 'تغيير حساس الأكسجين', true, 'engine');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير طرمبة البنزين', 'Fuel Pump Replacement', 'fuel-pump', 'تغيير طرمبة البنزين', true, 'engine');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('عمرة قير أوتوماتيك', 'Automatic Transmission Overhaul', 'auto-gearbox', 'عمرة قير أوتوماتيك', true, 'transmission');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('عمرة قير عادي', 'Manual Transmission Overhaul', 'manual-gearbox', 'عمرة قير يدوي', true, 'transmission');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير كلتش', 'Clutch Replacement', 'clutch', 'تغيير طقم الكلتش', true, 'transmission');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير دبل', 'Transfer Case Service', 'transfer-case', 'صيانة الدبل', true, 'transmission');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير زيت الدفرنس', 'Differential Oil Change', 'differential', 'تغيير زيت الدفرنس', true, 'transmission');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير عمود كردان', 'Driveshaft Replacement', 'driveshaft', 'تغيير عمود الكردان', true, 'transmission');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير مساعدات', 'Shock Absorbers Replacement', 'shock', 'تغيير المساعدات الأمامية والخلفية', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير يايات', 'Springs Replacement', 'spring', 'تغيير اليايات', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير جلنط', 'Ball Joint Replacement', 'ball-joint', 'تغيير الجلنط', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير ذراع سفلي', 'Control Arm Replacement', 'control-arm', 'تغيير الذراع السفلي', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير مقصات', 'Tie Rods Replacement', 'tie-rod', 'تغيير المقصات', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير اكسس', 'Axle Replacement', 'axle', 'تغيير الاكسس', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير فرامل أمامية', 'Front Brakes Replacement', 'brake-front', 'تغيير فرامل أمامية (بان + قماش)', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير فرامل خلفية', 'Rear Brakes Replacement', 'brake-rear', 'تغيير فرامل خلفية', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير طرمبة فرامل', 'Brake Master Pump Replacement', 'brake-pump', 'تغيير طرمبة الفرامل', true, 'suspension');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير اسطوانات فرامل', 'Brake Cylinder Replacement', 'brake-cylinder', 'تغيير اسطوانات الفرامل', true, 'suspension');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير دينمو', 'Alternator Replacement', 'alternator', 'تغيير دينمو السيارة', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير سلف', 'Starter Replacement', 'starter', 'تغيير سلف السيارة', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير بطارية', 'Battery Replacement', 'battery', 'تغيير بطارية السيارة', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير كويل', 'Ignition Coil Replacement', 'coil', 'تغيير كويل الاشعال', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('برمجة كمبيوتر', 'ECU Programming', 'ecu', 'برمجة كمبيوتر السيارة', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير حساسات', 'Sensors Replacement', 'sensor', 'تغيير جميع أنواع الحساسات', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('إصلاح أسواريم', 'Wiring Repair', 'wiring', 'إصلاح الأسواريم الكهربائية', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير لمبات', 'Bulbs Replacement', 'bulb', 'تغيير لمبات السيارة', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تركيب نظام صوت', 'Audio System Installation', 'audio', 'تركيب مسجل وسماعات', true, 'electrical');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تركيب إنذار', 'Alarm Installation', 'alarm', 'تركيب نظام إنذار', true, 'electrical');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('شحن فلور', 'AC Gas Refill', 'ac-gas', 'شحن فلور المكيف', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير كمبروسر', 'AC Compressor Replacement', 'ac-compressor', 'تغيير كمبروسر المكيف', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير ثرمستات', 'Thermostat Replacement', 'thermostat', 'تغيير الثرمستات', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير مروحة ردياتير', 'Radiator Fan Replacement', 'radiator-fan', 'تغيير مروحة الردياتير', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير ردياتير', 'Radiator Replacement', 'radiator', 'تغيير ردياتير الماء', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير طرمبة مكيف', 'AC Pump Replacement', 'ac-pump', 'تغيير طرمبة المكيف', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('غسيل ردياتير', 'Radiator Flush', 'radiator-flush', 'غسيل ردياتير المكيف', true, 'ac');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير مبخر', 'AC Evaporator Replacement', 'ac-evaporator', 'تغيير مبخر المكيف', true, 'ac');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('سمكرة', 'Dent Repair', 'dent', 'سمكرة وإصلاح الصدامات', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('دوكو', 'Painting', 'paint', 'دهان أجزاء السيارة', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('دهان كامل', 'Full Paint Job', 'full-paint', 'دهان السيارة كاملة', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('معجون', 'Body Filler', 'filler', 'معجون سمكرة', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تلميع سيارات', 'Car Polishing', 'polish', 'تلميع السيارة', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('إصلاح زجاج', 'Glass Repair', 'glass', 'إصلاح أو تغيير زجاج السيارة', true, 'bodywork');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تظليل', 'Window Tinting', 'tint', 'تظليل زجاج السيارة', true, 'bodywork');

INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('ونش سحاب', 'Tow Truck', 'tow', 'خدمة الونش وسحب السيارات المتعطلة', true, 'emergency');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('تغيير إطار', 'Tire Change', 'tire', 'تغيير إطار السيارة', true, 'emergency');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('بنزين طوارئ', 'Emergency Fuel', 'fuel', 'توصيل بنزين للطوارئ', true, 'emergency');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('فتح باب', 'Car Unlock', 'unlock', 'فتح باب السيارة المقفول', true, 'emergency');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('شحن بطارية', 'Battery Jump Start', 'jump-start', 'شحن بطارية السيارة', true, 'emergency');
INSERT INTO service_types (name, name_en, icon, description, is_active, category) VALUES ('ترحيل سيارة', 'Car Transport', 'transport', 'ترحيل السيارة', true, 'emergency');

-- ============================================
-- Workshops (الورش)
-- ============================================
INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type) VALUES ('ورشة الخبراء', 'أحمد محمد', '0501111111', 'expert@workshop.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'الرياض - حي النهضة', 'الرياض', 'صيانة دورية,مكينة,قير,كهرباء', 4.5, true, true, 'stationary');
INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type) VALUES ('ورشة التقنية', 'خالد عبدالله', '0502222222', 'tech@workshop.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'جدة - حي السلامة', 'جدة', 'سمكرة,دهان,تكييف,كهرباء', 4.2, true, true, 'stationary');
INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type) VALUES ('ورشة المتقن', 'سامي علي', '0503333333', 'master@workshop.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'الدمام - حي العدامة', 'الدمام', 'صيانة دورية,مكينة,قير', 4.8, true, true, 'stationary');
INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type) VALUES ('ورشة الصيانة السريعة', 'فهد عمر', '0504444444', 'quick@workshop.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'مكة - حي العزيزية', 'مكة', 'صيانة دورية,كهرباء,تكييف', 4.0, true, true, 'mobile');
INSERT INTO workshops (name, owner_name, phone, email, password, address, city, services, rating, is_active, is_approved, workshop_type) VALUES ('ورشة الإتقان', 'ناصر حسن', '0505555555', 'itqan@workshop.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'المدينة - حي العوالي', 'المدينة المنورة', 'سمكرة,دهان,ونش سحاب', 4.6, true, true, 'stationary');

-- ============================================
-- Admin Customer
-- ============================================
INSERT INTO customers (name, phone, email, password, city, is_active) VALUES ('Admin', '0575903086', 'admin@salaba.com', '$2b$10$dDChfFLz0WUzurXDq/KXP.BTfLEmm4A8w7nGx0Cu/e4BeIMYlHMiu', 'الرياض', true);
