// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CompanyRegistry — Registro de empresas del e-commerce
contract CompanyRegistry {
    struct Company {
        uint256 companyId;
        address companyAddress;
        string name;
        string description;
        bool isActive;
        uint256 registrationDate;
    }

    error AlreadyRegistered();
    error CompanyNotFound();
    error NotCompanyOwner();
    error EmptyName();

    event CompanyRegistered(uint256 indexed companyId, address indexed companyAddress, string name);
    event CompanyUpdated(uint256 indexed companyId, string name);

    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public addressToCompanyId;
    uint256 public companyCount;

    modifier onlyCompanyOwner(uint256 companyId) {
        if (companies[companyId].companyAddress != msg.sender) revert NotCompanyOwner();
        _;
    }

    /// @notice Registra una nueva empresa. Cada address solo puede tener una empresa.
    function registerCompany(string calldata name, string calldata description) external returns (uint256) {
        if (addressToCompanyId[msg.sender] != 0) revert AlreadyRegistered();
        if (bytes(name).length == 0) revert EmptyName();

        companyCount++;
        uint256 newId = companyCount;

        companies[newId] = Company({
            companyId: newId,
            companyAddress: msg.sender,
            name: name,
            description: description,
            isActive: true,
            registrationDate: block.timestamp
        });
        addressToCompanyId[msg.sender] = newId;

        emit CompanyRegistered(newId, msg.sender, name);
        return newId;
    }

    /// @notice Obtiene los datos de una empresa por ID.
    function getCompany(uint256 companyId) external view returns (Company memory) {
        if (companies[companyId].companyAddress == address(0)) revert CompanyNotFound();
        return companies[companyId];
    }

    /// @notice Obtiene los datos de la empresa registrada para una dirección.
    function getCompanyByAddress(address addr) external view returns (Company memory) {
        uint256 id = addressToCompanyId[addr];
        if (id == 0) revert CompanyNotFound();
        return companies[id];
    }

    /// @notice Retorna true si la dirección es owner de alguna empresa registrada.
    function isCompanyOwner(address addr) external view returns (bool) {
        return addressToCompanyId[addr] != 0;
    }

    /// @notice Actualiza nombre y descripción de la empresa (solo owner).
    function updateCompany(uint256 companyId, string calldata name, string calldata description)
        external
        onlyCompanyOwner(companyId)
    {
        if (bytes(name).length == 0) revert EmptyName();
        companies[companyId].name = name;
        companies[companyId].description = description;
        emit CompanyUpdated(companyId, name);
    }
}
