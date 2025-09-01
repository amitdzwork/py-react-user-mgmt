CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,         
    firstname VARCHAR(50) NOT NULL,     
    lastname  VARCHAR(50) NOT NULL,     
    age       INT,     
    date_of_birth DATE NOT NULL         
);