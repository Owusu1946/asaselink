INSERT INTO users (id,clerk_id,email,first_name,last_name,status,is_admin) VALUES
('d0000000-0000-4000-8000-000000000001','demo_company_actor','developer@demo.invalid','Demo','Developer','active',false),
('d0000000-0000-4000-8000-000000000002','demo_buyer_actor','buyer@demo.invalid','Demo','Buyer','active',false),
('d0000000-0000-4000-8000-000000000003','demo_admin_actor','admin@demo.invalid','Demo','Operations','active',true)
ON CONFLICT (id) DO UPDATE SET email=excluded.email,status='active';
--> statement-breakpoint
INSERT INTO buyer_profiles (id,user_id,first_name,last_name,communication_consent,completed_at) VALUES
('d1000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000002','Demo','Buyer',true,now())
ON CONFLICT (user_id) DO UPDATE SET completed_at=excluded.completed_at;
--> statement-breakpoint
INSERT INTO companies (id,legal_name,trade_name,registration_number,email,status) VALUES
('d2000000-0000-4000-8000-000000000001','AsaseLink Demonstration Estates Limited','Demo Estates','DEMO-2026','developer@demo.invalid','approved')
ON CONFLICT (id) DO UPDATE SET status='approved',legal_name=excluded.legal_name,trade_name=excluded.trade_name;
--> statement-breakpoint
INSERT INTO company_members (id,company_id,user_id,role,status) VALUES
('d3000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','owner','active')
ON CONFLICT (company_id,user_id) DO UPDATE SET role='owner',status='active';
--> statement-breakpoint
INSERT INTO estates (id,company_id,name,slug,description,region,district,address,status,price_from,boundary) VALUES
('d4000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000001','Estate A - Coastal View','demo-estate-a','Company-supplied demonstration estate with mapped prototype constraints.','Greater Accra','Accra Metropolitan','Demo location','approved',50000,ST_GeomFromText('MULTIPOLYGON(((-0.25 5.55,-0.24 5.55,-0.24 5.56,-0.25 5.56,-0.25 5.55)))',4326)),
('d4000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000001','Estate B - Ridge Gardens','demo-estate-b','Company-supplied demonstration estate for switching and purchase acceptance.','Greater Accra','La Nkwantanang Madina','Demo location','approved',65000,ST_GeomFromText('MULTIPOLYGON(((-0.19 5.67,-0.18 5.67,-0.18 5.68,-0.19 5.68,-0.19 5.67)))',4326))
ON CONFLICT (id) DO UPDATE SET name=excluded.name,status='approved',boundary=excluded.boundary;
--> statement-breakpoint
INSERT INTO plots (id,estate_id,plot_number,status,area_square_meters,price,boundary) VALUES
('d5000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001','A-AVAILABLE','AVAILABLE',900,50000,ST_GeomFromText('POLYGON((-0.249 5.551,-0.247 5.551,-0.247 5.553,-0.249 5.553,-0.249 5.551))',4326)),
('d5000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000001','A-LOCKED','RESERVED',900,52000,ST_GeomFromText('POLYGON((-0.246 5.551,-0.244 5.551,-0.244 5.553,-0.246 5.553,-0.246 5.551))',4326)),
('d5000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000001','A-HELD','RESERVED',900,54000,ST_GeomFromText('POLYGON((-0.243 5.551,-0.241 5.551,-0.241 5.553,-0.243 5.553,-0.243 5.551))',4326)),
('d5000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000001','A-PURCHASE','RESERVED',900,56000,ST_GeomFromText('POLYGON((-0.249 5.554,-0.247 5.554,-0.247 5.556,-0.249 5.556,-0.249 5.554))',4326)),
('d5000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000002','B-SOLD','SOLD',900,65000,ST_GeomFromText('POLYGON((-0.189 5.671,-0.187 5.671,-0.187 5.673,-0.189 5.673,-0.189 5.671))',4326)),
('d5000000-0000-4000-8000-000000000006','d4000000-0000-4000-8000-000000000002','B-EXPIRED','AVAILABLE',900,67000,ST_GeomFromText('POLYGON((-0.186 5.671,-0.184 5.671,-0.184 5.673,-0.186 5.673,-0.186 5.671))',4326)),
('d5000000-0000-4000-8000-000000000007','d4000000-0000-4000-8000-000000000002','B-REJECTED','AVAILABLE',900,69000,ST_GeomFromText('POLYGON((-0.183 5.671,-0.181 5.671,-0.181 5.673,-0.183 5.673,-0.183 5.671))',4326)),
('d5000000-0000-4000-8000-000000000008','d4000000-0000-4000-8000-000000000002','B-REFUND','AVAILABLE',900,71000,ST_GeomFromText('POLYGON((-0.189 5.674,-0.187 5.674,-0.187 5.676,-0.189 5.676,-0.189 5.674))',4326))
ON CONFLICT (id) DO UPDATE SET status=excluded.status,price=excluded.price,boundary=excluded.boundary;
--> statement-breakpoint
INSERT INTO reservations (id,reference,plot_id,buyer_user_id,type,status,price_snapshot,checkout_lock_minutes_snapshot,hold_duration_minutes_snapshot,hold_fee_snapshot,refund_percentage_snapshot,administrative_deduction_snapshot,refundable_amount_snapshot,terms_version_snapshot,terms_snapshot,payment_deadline_at,hold_started_at,expires_at) VALUES
('d6000000-0000-4000-8000-000000000002','DEMO-LOCKED','d5000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000002','CHECKOUT_LOCK','CHECKOUT_LOCKED',52000,30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,now()+interval '30 minutes',NULL,now()+interval '30 minutes'),
('d6000000-0000-4000-8000-000000000003','DEMO-HELD','d5000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-000000000002','PAID_HOLD','HELD',54000,30,10080,500,80,25,375,'v1','Prototype paid hold terms',now(),now(),now()+interval '7 days'),
('d6000000-0000-4000-8000-000000000004','DEMO-PURCHASE','d5000000-0000-4000-8000-000000000004','d0000000-0000-4000-8000-000000000002','CHECKOUT_LOCK','PURCHASE_IN_PROGRESS',56000,30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,now(),NULL,now()+interval '30 days'),
('d6000000-0000-4000-8000-000000000005','DEMO-SOLD','d5000000-0000-4000-8000-000000000005','d0000000-0000-4000-8000-000000000002','CHECKOUT_LOCK','SOLD',65000,30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,now(),NULL,now()+interval '30 days'),
('d6000000-0000-4000-8000-000000000006','DEMO-EXPIRED','d5000000-0000-4000-8000-000000000006','d0000000-0000-4000-8000-000000000002','CHECKOUT_LOCK','EXPIRED',67000,30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,now()-interval '2 days',NULL,now()-interval '1 day'),
('d6000000-0000-4000-8000-000000000007','DEMO-REJECTED','d5000000-0000-4000-8000-000000000007','d0000000-0000-4000-8000-000000000002','CHECKOUT_LOCK','CANCELLED',69000,30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,now()-interval '1 day',NULL,now()-interval '1 hour'),
('d6000000-0000-4000-8000-000000000008','DEMO-REFUND','d5000000-0000-4000-8000-000000000008','d0000000-0000-4000-8000-000000000002','PAID_HOLD','EXPIRED',71000,30,10080,500,80,25,375,'v1','Prototype paid hold terms',now()-interval '9 days',now()-interval '8 days',now()-interval '1 day')
ON CONFLICT (id) DO UPDATE SET status=excluded.status,expires_at=excluded.expires_at;
--> statement-breakpoint
INSERT INTO payments (id,reference,reservation_id,buyer_user_id,company_id,provider,provider_reference,method,status,purpose,amount,platform_fee_amount,developer_net_amount,currency,failure_reason) VALUES
('d7000000-0000-4000-8000-000000000007','DEMO-PAY-REJECTED','d6000000-0000-4000-8000-000000000007','d0000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000001','MOCK','DEMO-MOCK-REJECTED','BANK_TRANSFER','FAILED','PURCHASE',69000,0,69000,'GHS','Demonstration rejected proof')
ON CONFLICT (id) DO UPDATE SET status='FAILED',failure_reason=excluded.failure_reason;
--> statement-breakpoint
INSERT INTO reservation_refunds (id,reservation_id,amount,deduction,status,reason) VALUES
('d8000000-0000-4000-8000-000000000008','d6000000-0000-4000-8000-000000000008',375,25,'PENDING','Demonstration expired paid hold')
ON CONFLICT (reservation_id) DO UPDATE SET status='PENDING';
--> statement-breakpoint
INSERT INTO purchase_accounts (id,reference,buyer_user_id,company_id,estate_id,plot_id,source_reservation_id,price_snapshot,status,agreed_due_at) VALUES
('d9000000-0000-4000-8000-000000000004','DEMO-PURCHASE-ACCOUNT','d0000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001','d5000000-0000-4000-8000-000000000004','d6000000-0000-4000-8000-000000000004',56000,'PURCHASE_IN_PROGRESS',now()+interval '30 days'),
('d9000000-0000-4000-8000-000000000005','DEMO-COMPLETED-ACCOUNT','d0000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000002','d5000000-0000-4000-8000-000000000005','d6000000-0000-4000-8000-000000000005',65000,'COMPLETED',now())
ON CONFLICT (id) DO UPDATE SET status=excluded.status;
--> statement-breakpoint
INSERT INTO screening_layers (id,name,kind,severity,provenance,source_name,coverage_notes,confidence_notes,boundary,active) VALUES
('da000000-0000-4000-8000-000000000001','Demo coastal wetland','wetland','potential_restriction','prototype','AsaseLink deterministic demo','Prototype geometry only; not an official wetland determination.','Use for demonstration and confirm with EPA or relevant authority.',ST_GeomFromText('MULTIPOLYGON(((-0.249 5.551,-0.245 5.551,-0.245 5.555,-0.249 5.555,-0.249 5.551)))',4326),true),
('da000000-0000-4000-8000-000000000002','Demo flood caution','flood_risk','caution','prototype','AsaseLink deterministic demo','Prototype screening coverage around Estate B.','Indicative only.',ST_GeomFromText('MULTIPOLYGON(((-0.189 5.671,-0.185 5.671,-0.185 5.675,-0.189 5.675,-0.189 5.671)))',4326),true)
ON CONFLICT (id) DO UPDATE SET boundary=excluded.boundary,active=true;
