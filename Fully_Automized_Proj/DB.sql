/*MySQL code to create and operate the database efficiently*/
--Table for storing student data
CREATE TABLE STUDENT(Name VARCHAR(50), RN INT PRIMARY KEY,Address VARCHAR(200),Gender ENUM('MALE','FEMALE','OTHERS'),Email VARCHAR(50),phn VARCHAR(15),Attendence DOUBLE,latitude  DECIMAL(10, 8), 
  longitude DECIMAL(11, 8),Status ENUM('PRESENT', 'ABSENT', 'LATE'),totpre INT DEFAULT 0,totabs INT DEFAULT 0);
--Table to store Staff data and class information 
CREATE TABLE STAFF(Name VARCHAR(50),SID INT PRIMARY KEY,Email VARCHAR(50),latitude  DECIMAL(10, 8),longitude DECIMAL(11, 8));
--Table to store the data used for login purpose
CREATE TABLE LOGIN ( UserID INT PRIMARY KEY,Role ENUM('STUDENT', 'STAFF', 'ADMIN'),Username VARCHAR(50) UNIQUE,PasswordHash VARCHAR(255),LastLogin DATETIME);
