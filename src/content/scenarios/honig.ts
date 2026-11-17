// Honigernten (Uebung Views): Eine Ernte kann von mehreren Voelkern stammen (GESAMMELT),
// hat einen Honigtyp und eine Abpackung. Rekonstruiert, Spalten im SQL Developer mit DESC pruefen.

export const HONIG_SCHEMA = `
CREATE TABLE bienenvolk (
  volk_id NUMBER(4) PRIMARY KEY,
  bienenart VARCHAR2(40) NOT NULL
);
CREATE TABLE honigtyp (
  honigtyp_id NUMBER(4) PRIMARY KEY,
  bezeichnung VARCHAR2(40) NOT NULL,
  geschmack VARCHAR2(40)
);
CREATE TABLE abpackung (
  abpackung_id NUMBER(4) PRIMARY KEY,
  bezeichnung VARCHAR2(40) NOT NULL,
  art VARCHAR2(20),
  preis NUMBER(6,2)
);
CREATE TABLE honigernte (
  ernte_id NUMBER(4) PRIMARY KEY,
  menge NUMBER(6,1),
  erntedatum DATE,
  honigtyp_id NUMBER(4) REFERENCES honigtyp(honigtyp_id),
  abpackung_id NUMBER(4) REFERENCES abpackung(abpackung_id)
);
CREATE TABLE gesammelt (
  volk_id NUMBER(4) REFERENCES bienenvolk(volk_id),
  ernte_id NUMBER(4) REFERENCES honigernte(ernte_id),
  PRIMARY KEY (volk_id, ernte_id)
);
`;

export const HONIG_A = `
INSERT INTO bienenvolk VALUES (1, 'Carnica');
INSERT INTO bienenvolk VALUES (2, 'Buckfast');
INSERT INTO bienenvolk VALUES (3, 'Carnica');
INSERT INTO bienenvolk VALUES (4, 'Dunkle Biene');
INSERT INTO honigtyp VALUES (1, 'Rapshonig', 'mild');
INSERT INTO honigtyp VALUES (2, 'Waldhonig', 'herb');
INSERT INTO honigtyp VALUES (3, 'Akazienhonig', 'süß');
INSERT INTO abpackung VALUES (1, 'Glas 500 g', 'Glas', 6.50);
INSERT INTO abpackung VALUES (2, 'Glas 250 g', 'Glas', 3.90);
INSERT INTO abpackung VALUES (3, 'Eimer 5 kg', 'Eimer', 45.00);
INSERT INTO honigernte VALUES (1, 120.5, DATE '2025-05-20', 1, 1);
INSERT INTO honigernte VALUES (2, 80.0, DATE '2025-07-02', 2, 2);
INSERT INTO honigernte VALUES (3, 200.0, DATE '2025-06-10', 3, 3);
INSERT INTO honigernte VALUES (4, 55.5, DATE '2025-08-15', 2, 1);
INSERT INTO gesammelt VALUES (1, 1);
INSERT INTO gesammelt VALUES (2, 1);
INSERT INTO gesammelt VALUES (2, 2);
INSERT INTO gesammelt VALUES (3, 3);
INSERT INTO gesammelt VALUES (4, 4);
INSERT INTO gesammelt VALUES (1, 4);
`;

export const HONIG_B = `
INSERT INTO bienenvolk VALUES (1, 'Buckfast');
INSERT INTO bienenvolk VALUES (2, 'Ligustica');
INSERT INTO bienenvolk VALUES (3, 'Carnica');
INSERT INTO honigtyp VALUES (1, 'Lindenhonig', 'frisch');
INSERT INTO honigtyp VALUES (2, 'Heidehonig', 'kräftig');
INSERT INTO abpackung VALUES (1, 'Glas 500 g', 'Glas', 7.20);
INSERT INTO abpackung VALUES (2, 'Wabe', 'Holzrahmen', 12.00);
INSERT INTO honigernte VALUES (1, 64.0, DATE '2024-06-30', 1, 1);
INSERT INTO honigernte VALUES (2, 150.0, DATE '2024-08-20', 2, 2);
INSERT INTO honigernte VALUES (3, 90.5, DATE '2024-07-12', 1, 2);
INSERT INTO gesammelt VALUES (1, 1);
INSERT INTO gesammelt VALUES (3, 1);
INSERT INTO gesammelt VALUES (2, 2);
INSERT INTO gesammelt VALUES (3, 3);
`;

export const HONIG_RELATIONS = [
  'BIENENVOLK (VOLK_ID, BIENENART)',
  'HONIGTYP (HONIGTYP_ID, BEZEICHNUNG, GESCHMACK)',
  'ABPACKUNG (ABPACKUNG_ID, BEZEICHNUNG, ART, PREIS)',
  'HONIGERNTE (ERNTE_ID, MENGE, ERNTEDATUM, HONIGTYP_ID <fk>, ABPACKUNG_ID <fk>)',
  'GESAMMELT (VOLK_ID <fk>, ERNTE_ID <fk>)',
];
