// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract DaoHubState {
    struct DaoState {
        string merkleTreeUrl; // Should be relatively static... points to a centralized DB storing the entire MTree
        bytes32 root; // Should be dynamic... updated daily to reflect new activity by users
    }

    // Stores the states of all DAOs that are using the hub for microtasks
    // NOTE: the address for a DAO could be a single EOA, but it's prob a multi-sig that's controlled by the DAO admins
    mapping(address => DaoState) public states;

    modifier DaoExists() {
        require(states[msg.sender].root != 0, "DAO has not been instantiated.");
        _;
    }

    event RootUpdated(bytes32 newRoot);

    function getRoot(address daoAddress) public view returns (bytes32) {
        return states[daoAddress].root;
    }

    // Start tracking the state for a DAO
    function instantiateDao(string calldata merkleTreeUrl, bytes32 root)
        public
    {
        states[msg.sender] = DaoState(merkleTreeUrl, root);
        emit RootUpdated(root);
    }

    // For daily updates to DAO state
    function updateRoot(bytes32 _newRoot) public DaoExists {
        states[msg.sender].root = _newRoot;
        emit RootUpdated(_newRoot);
    }

    // Just in case the DAO wants to update its MTree url (e.g. because they've switched to a new db)
    function updateMTreeUrl(string calldata _newUrl) public DaoExists {
        states[msg.sender].merkleTreeUrl = _newUrl;
    }
}
