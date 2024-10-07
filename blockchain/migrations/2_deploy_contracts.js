const LendingTracker = artifacts.require("LoanContract");

module.exports = function (deployer) {
    deployer.deploy(LendingTracker);
};
