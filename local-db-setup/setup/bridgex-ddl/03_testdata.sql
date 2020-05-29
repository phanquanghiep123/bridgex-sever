INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '@9MDTXC8L', '192.168.0.1', 'teller machine-1');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '@ZAL5WYUR', '', 'note');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '@YCS1KAGR', '192.168.0.2', '');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '@999000', '192.168.0.23', 'my note');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '@987000', '192.168.0.33', 'my note');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '500005', '192.168.0.211', '');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', '100001', '127.0.1.100', 'my teller machine-1');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', 'test7000', '192.168.0.7', 'test teller');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', 'test100', '192.168.0.111', 'test teller');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI10', 'test200', '192.168.0.11', 'test teller');
INSERT INTO asset_elements (type_id, asset_id, ip_address, note) VALUES ('CI100', '300003', '', '');

INSERT INTO asset_status VALUES (DEFAULT, 'RBG100', '[delete all] @990001-01', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'RBG200', '000001', 'Missing', '0001');
INSERT INTO asset_status VALUES (DEFAULT, 'RBG200', '[delete all] @990001-02', 'Error', '0008');
INSERT INTO asset_status VALUES (DEFAULT, 'RBG200 HA', '1001', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'UWF', '[unavailable] 880001', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'GLR', '1100', 'Good', '0010');
INSERT INTO asset_status VALUES (DEFAULT, 'TYPE-GATEWAY-05', '@ASSET-GATEWAY-01', 'Error', '2000');
INSERT INTO asset_status VALUES (DEFAULT, 'CI10', '100001', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI10', '@2001020', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI10', '@3001020', 'Missing', '1004');
INSERT INTO asset_status VALUES (DEFAULT, 'CI10', '@4001020', 'Error', '1005');
INSERT INTO asset_status VALUES (DEFAULT, 'CI10', '@12345678', 'Error', '1009');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '000011', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '200002', 'Error', '0005');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '000013', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '100001', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '100002', 'Missing', '3002');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '100003', 'Missing', '7000');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '100004', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI50', '100005', 'Error', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI100', '300003', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'CI200', '400004', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'RBG100', '@000013-13', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'RBG300', '@000015-15', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'SCW20', '@000004-04', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'SCW20A', '@000005-05', 'Good', '');
INSERT INTO asset_status VALUES (DEFAULT, 'WR500', '@000010-10', 'Error', '');
INSERT INTO asset_status VALUES (DEFAULT, 'USF50A', '@000002-02', 'Error', '');
INSERT INTO asset_status VALUES (DEFAULT, 'USF200A', '@000008-08', 'Error', '');

INSERT INTO asset_inventories (id, type_id, asset_id, units, updated_at)
  VALUES (DEFAULT, 'RBG100', '@000003-03', '[{"unit":"casset 3","status":"Full","nearFull":550,"nearEmpty":10,"capacity":600,"denominations":[{"currencyCode":"EUR","faceValue":"20","count":0,"revision":0}]},{"unit":"casset 2","status":"NearFull","nearFull":550,"nearEmpty":10,"capacity":600,"denominations":[{"currencyCode":"EUR","faceValue":"20","count":0,"revision":0}]}]', '2020-01-28 08:00:00');
INSERT INTO asset_inventories (id, type_id, asset_id, units, updated_at)
  VALUES (DEFAULT,'RBG200',  '@000008-08', '[{"unit":"casset A","status":"Full","nearFull":550,"nearEmpty":10,"capacity":600,"denominations":[{"currencyCode":"EUR","faceValue":"20","count":0,"revision":0}]}]', '2020-01-28 08:00:00');
INSERT INTO asset_inventories (id, type_id, asset_id, units, updated_at)
  VALUES (DEFAULT, 'RBG200', '@000014-14', '[{"unit":"casset 1","status":"NearFull","nearFull":550,"nearEmpty":100,"capacity":900,"denominations":[{"currencyCode":"EUR","faceValue":"20","count":0,"revision":0}]}]', '2020-01-28 01:45:49');
INSERT INTO asset_inventories (id, type_id, asset_id, units, updated_at)
  VALUES (DEFAULT,  'RBG300','@000015-15', '[{"unit":"casset 1","status":"NearFull","nearFull":850,"nearEmpty":100,"capacity":1000,"denominations":[{"currencyCode":"EUR","faceValue":"100","count":0,"revision":0}]}]', '2020-01-28 08:30:16');

SELECT setval('packages_id_seq', 1, false);
INSERT INTO "public".packages(id,package_id,name,status,"comment",upload_utc,upload_by,summary,description,model,memo,bucket_name,object_name,ftp_file_path,delete_flag) VALUES (1,'{64676fdc-20d9-4cad-811c-7e347422f38c}','RCW100-firmware-package.20200214_for_demo.zip','Complete','','2020/02/27 3:02:02.955','test01 user01','RCW-100 firmware','firmware package','RCW100','RCW-A007','bridge-x-packages','packages/64676fdc-20d9-4cad-811c-7e347422f38c/RCW100-firmware-package.20200214_for_demo.zip','packages/64676fdc-20d9-4cad-811c-7e347422f38c/K05_coin.1_20200214.tar.gz',False);
INSERT INTO "public".packages(id,package_id,name,status,"comment",upload_utc,upload_by,summary,description,model,memo,bucket_name,object_name,ftp_file_path,delete_flag) VALUES (2,'{6c0e6975-8a6f-4b6f-883d-7c11ddc91fdc}','RBW100-firmware-package.20200214_for_demo.zip','Complete','','2020/02/27 4:03:29.558','test01 user01','RBW-100 firmware','firmware package','RBW100','0214','bridge-x-packages','packages/6c0e6975-8a6f-4b6f-883d-7c11ddc91fdc/RBW100-firmware-package.20200214_for_demo.zip','packages/6c0e6975-8a6f-4b6f-883d-7c11ddc91fdc/K05_note.1_20200214.tar.gz',False);

INSERT INTO "public".package_elements(id,package_id,"key","value") VALUES (1,1,'firmware','A006D');
INSERT INTO "public".package_elements(id,package_id,"key","value") VALUES (2,2,'firmware','A008');

SELECT setval('task_log_id_seq', 1, false);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00001','Scheduled','Trace','MEMO-0000000000-0000000001',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00002','InProgress','Trace','',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00003','Failure','Trace','MEMO-0000000000-0000000003',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00004','Complete','Trace','',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00005','Scheduled','Business','MEMO-0000000000-0000000005',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00006','InProgress','Business','',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00007','Failure','Business','MEMO-0000000000-0000000007',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00008','Complete','Business','',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00009','Complete','Trace','MEMO-0000000000-0000000009',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00010','Complete','Business','',DEFAULT,DEFAULT);
INSERT INTO task_log VALUES (DEFAULT,'0416fdd6-51be-5cc6-2c12-5a653ab00011','Failure','Trace','MEMO-0000000000-0000000011',DEFAULT,DEFAULT);

INSERT INTO task_log_assets VALUES (1,'100001','CI10','Scheduled','2020/03/01 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (1,'200002','CI50','Scheduled','2020/03/02 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (2,'100001','CI10','InProgress','2020/03/03 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (2,'200002','CI50','InProgress','2020/03/04 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (3,'100001','CI10','ConnectionError','2020/03/05 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (3,'200002','CI50','ConnectionError','2020/03/06 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (4,'100001','CI10','Complete','2020/03/07 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (4,'200002','CI50','Complete','2020/03/08 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (5,'300003','CI100','Scheduled','2020/03/09 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (6,'300003','CI100','InProgress','2020/03/10 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (7,'300003','CI100','DeviceError','2020/03/11 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (8,'300003','CI100','Complete','2020/03/12 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (9,'100001','CI10','Complete','2020/03/13 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (9,'200002','CI50','Complete','2020/03/14 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (10,'300003','CI100','Complete','2020/03/15 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (11,'100001','CI10','SystemError','2020/03/16 02:02:02.000',DEFAULT);
INSERT INTO task_log_assets VALUES (11,'200002','CI50','SystemError','2020/03/17 02:02:02.000',DEFAULT);

INSERT INTO task_log_retrievelogs VALUES (1,'100001','CI10','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (1,'200002','CI50','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00002/model-asset-02.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (2,'100001','CI10','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00003/model-asset-03.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (2,'200002','CI50','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00004/model-asset-04.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (4,'100001','CI10','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00005/model-asset-05.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (4,'200002','CI50','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00006/model-asset-06.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (5,'300003','CI100','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00007/model-asset-07.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (6,'300003','CI100','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00008/model-asset-08.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (8,'300003','CI100','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00009/model-asset-09.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (9,'100001','CI10','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00010/model-asset-10.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (9,'200002','CI50','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00011/model-asset-11.tar.gz');
INSERT INTO task_log_retrievelogs VALUES (10,'300003','CI100','ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00012/model-asset-12.tar.gz');

INSERT INTO retrievelogs VALUES (1,'100001','CI10','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (2,'100001','CI10','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (2,'200002','CI50','Error','1001','Upload Error1',DEFAULT);
INSERT INTO retrievelogs VALUES (4,'100001','CI10','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (4,'200002','CI50','Error','2002','Upload Error2',DEFAULT);
INSERT INTO retrievelogs VALUES (6,'300003','CI100','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (8,'300003','CI100','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (9,'100001','CI10','Succeed','','',DEFAULT);
INSERT INTO retrievelogs VALUES (9,'200002','CI50','Error','3003','Upload Error3',DEFAULT);
INSERT INTO retrievelogs VALUES (10,'300003','CI100','Error','4004','Upload Error4',DEFAULT);
