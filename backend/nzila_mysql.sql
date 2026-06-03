-- =============================================================
--  NZILA — Script de Base de Dados MySQL
--  Gerado em: 2026-06-03
--  Charset   : utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================

CREATE DATABASE IF NOT EXISTS nzila_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nzila_db;

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 0. TABELAS DO DJANGO AUTH (obrigatórias)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_permission (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)    NOT NULL,
    content_type_id INT UNSIGNED  NOT NULL,
    codename      VARCHAR(100)    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_content_type (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model     VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_app_model (app_label, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_group (
    id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_group_permissions (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id      INT UNSIGNED    NOT NULL,
    permission_id INT UNSIGNED    NOT NULL,
    UNIQUE KEY unique_group_perm (group_id, permission_id),
    CONSTRAINT fk_agp_group      FOREIGN KEY (group_id)      REFERENCES auth_group(id)      ON DELETE CASCADE,
    CONSTRAINT fk_agp_permission FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_user (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    password     VARCHAR(128)  NOT NULL,
    last_login   DATETIME(6)   NULL,
    is_superuser TINYINT(1)    NOT NULL DEFAULT 0,
    username     VARCHAR(150)  NOT NULL UNIQUE,
    first_name   VARCHAR(150)  NOT NULL DEFAULT '',
    last_name    VARCHAR(150)  NOT NULL DEFAULT '',
    email        VARCHAR(254)  NOT NULL DEFAULT '',
    is_staff     TINYINT(1)    NOT NULL DEFAULT 0,
    is_active    TINYINT(1)    NOT NULL DEFAULT 1,
    date_joined  DATETIME(6)   NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_user_groups (
    id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id  INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NOT NULL,
    UNIQUE KEY unique_user_group (user_id, group_id),
    CONSTRAINT fk_aug_user  FOREIGN KEY (user_id)  REFERENCES auth_user(id)  ON DELETE CASCADE,
    CONSTRAINT fk_aug_group FOREIGN KEY (group_id) REFERENCES auth_group(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_user_user_permissions (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED    NOT NULL,
    permission_id INT UNSIGNED    NOT NULL,
    UNIQUE KEY unique_user_perm (user_id, permission_id),
    CONSTRAINT fk_auup_user       FOREIGN KEY (user_id)       REFERENCES auth_user(id)       ON DELETE CASCADE,
    CONSTRAINT fk_auup_permission FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS authtoken_token (
    `key`    VARCHAR(40)  NOT NULL PRIMARY KEY,
    created  DATETIME(6)  NOT NULL,
    user_id  INT UNSIGNED NOT NULL UNIQUE,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_session (
    session_key  VARCHAR(40)   NOT NULL PRIMARY KEY,
    session_data LONGTEXT      NOT NULL,
    expire_date  DATETIME(6)   NOT NULL,
    INDEX idx_session_expire (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_migrations (
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    app     VARCHAR(255) NOT NULL,
    name    VARCHAR(255) NOT NULL,
    applied DATETIME(6)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_admin_log (
    id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    action_time     DATETIME(6)     NOT NULL,
    object_id       LONGTEXT        NULL,
    object_repr     VARCHAR(200)    NOT NULL,
    action_flag     SMALLINT UNSIGNED NOT NULL,
    change_message  LONGTEXT        NOT NULL,
    content_type_id INT UNSIGNED    NULL,
    user_id         INT UNSIGNED    NOT NULL,
    CONSTRAINT fk_dal_content_type FOREIGN KEY (content_type_id) REFERENCES django_content_type(id) ON DELETE SET NULL,
    CONSTRAINT fk_dal_user         FOREIGN KEY (user_id)         REFERENCES auth_user(id)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 1. EMPRESAS TRANSPORTADORAS  (companies)
--    Criada antes de users porque users tem FK para companies
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome                  VARCHAR(100)  NOT NULL,
    nome_comercial        VARCHAR(100)  NULL,
    code                  VARCHAR(50)   NULL,
    nif                   VARCHAR(50)   NULL UNIQUE,
    ano_fundacao          INT           NULL,
    tipo_empresa          VARCHAR(50)   NULL,
    provincia             VARCHAR(100)  NULL,
    municipio             VARCHAR(100)  NULL,
    endereco              TEXT          NULL,
    telefone              VARCHAR(20)   NULL,
    telefone_alt          VARCHAR(20)   NULL,
    email                 VARCHAR(100)  NULL,
    status                ENUM('PENDENTE','APROVADA','REJEITADA','SUSPENSA') NOT NULL DEFAULT 'PENDENTE',
    motivo_rejeicao       TEXT          NULL,
    logo_url              VARCHAR(250)  NULL,
    descricao             TEXT          NULL,
    color                 VARCHAR(100)  NOT NULL DEFAULT 'bg-blue-600',
    rating                FLOAT         NOT NULL DEFAULT 4.5,
    reviews               INT           NOT NULL DEFAULT 100,
    politica_cancelamento TEXT          NULL,
    created_at            DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. DOCUMENTOS DA EMPRESA  (company_documents)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_documents (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id  BIGINT UNSIGNED NOT NULL,
    tipo        ENUM('REGISTO_COMERCIAL','ALVARA','CONTRIBUINTE','ESTATUTOS') NOT NULL,
    arquivo_url TEXT            NOT NULL,
    aprovado    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_cdoc_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. ADMINISTRADORES DA EMPRESA  (company_admin)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_admin (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id              BIGINT UNSIGNED NOT NULL,
    nome                    VARCHAR(100)    NOT NULL,
    email                   VARCHAR(100)    NOT NULL UNIQUE,
    telefone                VARCHAR(20)     NOT NULL,
    password                VARCHAR(255)    NOT NULL,
    cargo                   VARCHAR(100)    NULL,
    documento_identificacao VARCHAR(100)    NULL,
    CONSTRAINT fk_cadm_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. PERFIS DE UTILIZADORES  (users)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED    NOT NULL UNIQUE,   -- FK → auth_user.id
    nome       VARCHAR(100)    NOT NULL,
    email      VARCHAR(100)    NOT NULL UNIQUE,
    telefone   VARCHAR(20)     NULL,
    role       ENUM('CLIENTE','ADMIN','OPERADOR') NOT NULL DEFAULT 'CLIENTE',
    document   VARCHAR(100)    NULL,
    avatar     VARCHAR(500)    NULL,
    company_id BIGINT UNSIGNED NULL,              -- FK → companies.id
    created_at DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_usr_auth_user FOREIGN KEY (user_id)    REFERENCES auth_user(id)  ON DELETE CASCADE,
    CONSTRAINT fk_usr_company   FOREIGN KEY (company_id) REFERENCES companies(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. LOCALIZAÇÕES / CIDADES  (locations)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
    id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. ROTAS  (routes)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS routes (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    origem_id        BIGINT UNSIGNED NOT NULL,
    destino_id       BIGINT UNSIGNED NOT NULL,
    distancia_km     DECIMAL(10,2)   NOT NULL,
    duracao_estimada TIME            NOT NULL,
    CONSTRAINT fk_route_origem  FOREIGN KEY (origem_id)  REFERENCES locations(id) ON DELETE CASCADE,
    CONSTRAINT fk_route_destino FOREIGN KEY (destino_id) REFERENCES locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 7. AUTOCARROS  (buses)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS buses (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id BIGINT UNSIGNED NOT NULL,
    modelo     VARCHAR(100)    NOT NULL,
    capacidade INT             NOT NULL,
    CONSTRAINT fk_bus_empresa FOREIGN KEY (empresa_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 8. ASSENTOS  (seats)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS seats (
    id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT UNSIGNED NOT NULL,
    numero VARCHAR(10)     NOT NULL,
    CONSTRAINT fk_seat_bus FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 9. VIAGENS  (trips)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trips (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id      BIGINT UNSIGNED NOT NULL,
    route_id        BIGINT UNSIGNED NOT NULL,
    bus_id          BIGINT UNSIGNED NOT NULL,
    data_saida      DATE            NOT NULL,
    hora_saida      TIME            NOT NULL,
    hora_chegada    TIME            NOT NULL,
    preco_ida       DECIMAL(10,2)   NOT NULL,
    preco_ida_volta DECIMAL(10,2)   NULL,
    classe          ENUM('ECONOMICA','CONFORTO','EXECUTIVA') NOT NULL,
    status          ENUM('ATIVA','CANCELADA') NOT NULL DEFAULT 'ATIVA',
    amenities       TEXT            NOT NULL DEFAULT 'ar-condicionado,wifi,tomada',
    CONSTRAINT fk_trip_empresa FOREIGN KEY (empresa_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_trip_route   FOREIGN KEY (route_id)   REFERENCES routes(id)    ON DELETE CASCADE,
    CONSTRAINT fk_trip_bus     FOREIGN KEY (bus_id)     REFERENCES buses(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 10. RESERVAS  (reservations)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reservations (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva VARCHAR(50)  NOT NULL UNIQUE,
    user_id        INT UNSIGNED NOT NULL,   -- FK → auth_user.id
    trip_id        BIGINT UNSIGNED NOT NULL,
    status         ENUM('PENDENTE','CONFIRMADA','CANCELADA','EMBARCADO') NOT NULL DEFAULT 'CONFIRMADA',
    total          DECIMAL(10,2)   NOT NULL,
    created_at     DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_trip FOREIGN KEY (trip_id) REFERENCES trips(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 11. ASSENTOS RESERVADOS  (reservation_seats)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reservation_seats (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT UNSIGNED NOT NULL,
    seat_id        BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY unique_res_seat (reservation_id, seat_id),
    CONSTRAINT fk_rss_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rss_seat        FOREIGN KEY (seat_id)        REFERENCES seats(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 12. PAGAMENTOS  (payments)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT UNSIGNED NOT NULL,
    metodo         ENUM('MULTICAIXA','UNITEL_MONEY','PAYPAY') NOT NULL,
    status         ENUM('PENDENTE','PAGO','FALHOU') NOT NULL DEFAULT 'PENDENTE',
    referencia     VARCHAR(100) NULL,
    valor          DECIMAL(10,2) NOT NULL,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_pay_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 13. BILHETES / QR CODE  (tickets)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tickets (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id  BIGINT UNSIGNED NOT NULL,
    qr_code         TEXT            NOT NULL,
    token           VARCHAR(255)    NOT NULL UNIQUE,
    usado           TINYINT(1)      NOT NULL DEFAULT 0,
    data_validacao  DATETIME(6)     NULL,
    CONSTRAINT fk_tkt_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 14. NOTIFICAÇÕES  (notifications)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED    NOT NULL,   -- FK → auth_user.id
    tipo       ENUM('CONFIRMACAO','LEMBRETE','CANCELAMENTO') NOT NULL,
    mensagem   TEXT            NOT NULL,
    enviado    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================

-- reservations
CREATE INDEX idx_res_user   ON reservations (user_id);
CREATE INDEX idx_res_trip   ON reservations (trip_id);
CREATE INDEX idx_res_status ON reservations (status);

-- trips
CREATE INDEX idx_trip_data   ON trips (data_saida);
CREATE INDEX idx_trip_status ON trips (status);
CREATE INDEX idx_trip_route  ON trips (route_id);
CREATE INDEX idx_trip_emp    ON trips (empresa_id);

-- payments
CREATE INDEX idx_pay_status ON payments (status);
CREATE INDEX idx_pay_res    ON payments (reservation_id);

-- tickets
CREATE INDEX idx_tkt_usado ON tickets (usado);

-- notifications
CREATE INDEX idx_notif_user    ON notifications (user_id);
CREATE INDEX idx_notif_enviado ON notifications (enviado);

-- =============================================================
-- DADOS INICIAIS DE DEMONSTRAÇÃO
-- =============================================================

-- Localizações (províncias de Angola)
INSERT INTO locations (nome, provincia) VALUES
('Luanda',           'Luanda'),
('Viana',            'Luanda'),
('Cacuaco',          'Luanda'),
('Huambo',           'Huambo'),
('Lobito',           'Benguela'),
('Benguela',         'Benguela'),
('Lubango',          'Huíla'),
('Malanje',          'Malanje'),
('Uíge',             'Uíge'),
('Saurimo',          'Lunda Sul'),
('Cabinda',          'Cabinda'),
('Sumbe',            'Cuanza Sul'),
('N''dalatando',     'Cuanza Norte'),
('Dundo',            'Lunda Norte'),
('Menongue',         'Cuando Cubango');

-- Empresa demo
INSERT INTO companies (nome, nome_comercial, code, nif, tipo_empresa, provincia, municipio, telefone, email, status, color, rating, reviews, descricao)
VALUES ('Macon Transportes', 'Macon', 'MACON', '5000123456', 'LDA', 'Luanda', 'Belas', '+244 923 101 010', 'macon@macon.ao', 'APROVADA', 'bg-blue-600', 4.8, 320, 'Transportadora líder em Angola com rotas nacionais.');

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- FIM DO SCRIPT
-- =============================================================
