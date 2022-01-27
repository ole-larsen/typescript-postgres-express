-- Up Migration
CREATE TABLE user_account (
       user_id INT NOT NULL,
       account_id INT NOT NULL,
       PRIMARY KEY (user_id, account_id),
       CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
       CONSTRAINT fk_account FOREIGN KEY(account_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
-- Down Migration
DROP TABLE IF EXISTS user_account;