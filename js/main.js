const node = new Aeternity.Node("https://testnet.aeternity.io");

// Init SDK instance with AeSdk class
const aeSdk = new Aeternity.AeSdk({
  nodes: [{ name: "test-net", instance: node }],
  onCompiler: new Aeternity.CompilerHttp("https://v7.compiler.stg.aepps.com"),
});

var contractPublic = null;

async function getContract() {
  const contract = await aeSdk.initializeContract({
    sourceCode: investmentContractCode,
  });
  var aci = contract._aci;
  contractPublic = await aeSdk.initializeContract({
    aci,
    address: investmentContractAddress,
  });
}

async function getClubs() {
  await getContract();
  if (contractPublic != undefined) {
    var clubs = await contractPublic.listClubs();
    if (clubs.decodedResult.size > 0) {
      var list = document.querySelector(".available_clubs");
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");

      var theadTr = document.createElement("tr");
      var balanceHeader = document.createElement("th");
      balanceHeader.innerHTML = "ID";
      theadTr.appendChild(balanceHeader);
      var contractNameHeader = document.createElement("th");
      contractNameHeader.innerHTML = "Name";
      theadTr.appendChild(contractNameHeader);
      var contractTickerHeader = document.createElement("th");
      contractTickerHeader.innerHTML = "Members";
      theadTr.appendChild(contractTickerHeader);

      var usdHeader = document.createElement("th");
      usdHeader.innerHTML = "Proposals";
      theadTr.appendChild(usdHeader);

      thead.appendChild(theadTr);

      table.className = "table";
      table.appendChild(thead);

      clubs.decodedResult.forEach((valor, clave) => {
        var tbodyTr = document.createElement("tr");
        var contractTd = document.createElement("td");
        contractTd.innerHTML =
          "<a class='btn btn-success' onclick='changeClub(" +
          valor.id +
          ")''>" +
          valor.id +
          "</a>";
        tbodyTr.appendChild(contractTd);
        var contractTickerTd = document.createElement("td");
        contractTickerTd.innerHTML = "<b>" + valor.name + "</b>";
        tbodyTr.appendChild(contractTickerTd);
        var balanceTd = document.createElement("td");
        balanceTd.innerHTML = "<b>" + valor.members.size + "</b>";
        tbodyTr.appendChild(balanceTd);
        var balanceUSDTd = document.createElement("td");
        balanceUSDTd.innerHTML = "<b>" + valor.proposals.size + "</b>";
        tbodyTr.appendChild(balanceUSDTd);
        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);

      list.appendChild(table);
    }
    $(".loading_message").css("display", "none");
  }
}

async function runProposal() {
  await getContract();
  if (contractPublic != undefined) {
    var option_execution = $("#option_execution").val();
    var password = $("#passwordShowPVExecution").val();
    if (option_execution == "") {
      $(".errorExecution").css("display", "block");
      $(".errorExecution").text("Option is required");
      return;
    }
    if (password == "") {
      $(".errorExecution").css("display", "block");
      $(".errorExecution").text("Password is invalid");
      return;
    }
    var clubId = localStorage.getItem("clubId");
    var proposalId = localStorage.getItem("proposalId");
    try {
      var privateKey = CryptoJS.AES.decrypt(
        localStorage.getItem("aeWalletSecret"),
        password
      ).toString(CryptoJS.enc.Utf8);
      if (privateKey !== "") {
        $(".errorExecution").css("display", "none");
        const originWallet = new Aeternity.MemoryAccount(privateKey);
        $(".successExecution").css("display", "block");
        $(".successExecution").text("Running...");
        await aeSdk.addAccount(originWallet, { select: true });
        try {
          if (option_execution == "execute") {
            await contractPublic.executeProposal(clubId, proposalId);
          } else {
            if (option_execution == "close") {
              await contractPublic.closeProposal(clubId, proposalId);
            }
          }
        } catch (error) {
          $(".successExecution").css("display", "none");
          $(".errorExecution").css("display", "block");
          $(".errorExecution").text(error.toString());
          return;
        }

        $("#option_execution").val("");
        $("#passwordShowPVExecution").val("");
        $(".errorExecution").css("display", "none");
        $(".successExecution").css("display", "block");
        $(".successExecution").text("The execution was successful ");
        location.reload();
      } else {
        $(".valid-feedback").css("display", "none");
        $(".invalid-feedback").css("display", "block");
        $(".invalid-feedback").text("The password is invalid");
      }
    } catch {
      $(".valid-feedback").css("display", "none");
      $(".invalid-feedback").css("display", "block");
      $(".invalid-feedback").text("The password is invalid");
    }
  }
}

async function getProposalById() {
  await getContract();
  if (contractPublic != undefined) {
    var aeWalletAddress = localStorage.getItem("aeWalletAddress");
    var clubId = localStorage.getItem("clubId");
    var proposalId = localStorage.getItem("proposalId");
    var clubs = await contractPublic.getProposalById(clubId, proposalId);
    if (clubs.decodedResult != undefined) {
      $(".proposal_description").text(clubs.decodedResult.description);
      $("#proposal_creator").text(clubs.decodedResult.creator);
      $("#proposal_destination").text(clubs.decodedResult.destination);
      $("#proposal_amount").text(Aeternity.toAe(clubs.decodedResult.amount));
      $("#proposal_status").text(clubs.decodedResult.status);
      $("#votes_for").text(clubs.decodedResult.votesFor);
      $("#votes_against").text(clubs.decodedResult.votesAgainst);

      if (
        clubs.decodedResult.status == "Pending" &&
        clubs.decodedResult.creator == aeWalletAddress
      ) {
        $(".creator_options").css("display", "block");
      }
      if (clubs.decodedResult.status != "Pending") {
        $(".votes_available").css("display", "none");
      }

      var list = document.querySelector(".my_votes");
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");

      var theadTr = document.createElement("tr");
      var balanceHeader = document.createElement("th");
      balanceHeader.innerHTML = "Voter";
      theadTr.appendChild(balanceHeader);
      var usdHeader2 = document.createElement("th");
      usdHeader2.innerHTML = "Option";
      theadTr.appendChild(usdHeader2);

      thead.appendChild(theadTr);

      table.className = "table";
      table.appendChild(thead);

      clubs.decodedResult.voted.forEach((valor, clave) => {
        var tbodyTr = document.createElement("tr");
        var contractTickerTd = document.createElement("td");
        contractTickerTd.innerHTML = "<b>" + clave + "</b>";
        tbodyTr.appendChild(contractTickerTd);
        var balanceUSDTd2 = document.createElement("td");
        balanceUSDTd2.innerHTML = "<b>" + valor + "</b>";
        tbodyTr.appendChild(balanceUSDTd2);
        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);

      list.appendChild(table);
    }
    $(".loading_message").css("display", "none");
  }
}

async function voteOnProposal() {
  await getContract();
  if (contractPublic != undefined) {
    var option_vote = $("#option_vote").val();
    var password = $("#passwordShowPVVote").val();
    if (option_vote == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Vote is required");
      return;
    }
    if (password == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Password is invalid");
      return;
    }
    var clubId = localStorage.getItem("clubId");
    var proposalId = localStorage.getItem("proposalId");
    var privateKey = CryptoJS.AES.decrypt(
      localStorage.getItem("aeWalletSecret"),
      password
    ).toString(CryptoJS.enc.Utf8);
    if (privateKey !== "") {
      const originWallet = new Aeternity.MemoryAccount(privateKey);
      $(".successVote").css("display", "block");
      $(".successVote").text("Voting...");
      await aeSdk.addAccount(originWallet, { select: true });
      var optionBool = option_vote == "1" ? true : false;
      try {
        await contractPublic.voteOnProposal(clubId, proposalId, optionBool);
      } catch (error) {
        $(".successVote").css("display", "none");
        $(".errorVote").css("display", "block");
        $(".errorVote").text(error.toString());
        return;
      }

      $("#option_vote").val("");
      $("#passwordShowPVVote").val("");
      $("#errorVote").css("display", "none");
      $("#successVote").css("display", "block");
      $("#successVote").text("Your vote was successful ");
      location.reload();
    } else {
      $(".valid-feedback").css("display", "none");
      $(".invalid-feedback").css("display", "block");
      $(".invalid-feedback").text("The password is invalid");
    }
  }
}

async function getProposals() {
  await getContract();
  if (contractPublic != undefined) {
    var clubId = localStorage.getItem("clubId");
    var clubs = await contractPublic.getProposalsByClub(clubId);
    if (clubs.decodedResult.size > 0) {
      var list = document.querySelector(".available_proposals");
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");

      var theadTr = document.createElement("tr");
      var balanceHeader = document.createElement("th");
      balanceHeader.innerHTML = "ID";
      theadTr.appendChild(balanceHeader);
      var contractNameHeader = document.createElement("th");
      contractNameHeader.innerHTML = "Description";
      theadTr.appendChild(contractNameHeader);
      var contractTickerHeader = document.createElement("th");
      contractTickerHeader.innerHTML = "Amount (AE)";
      theadTr.appendChild(contractTickerHeader);

      var usdHeader2 = document.createElement("th");
      usdHeader2.innerHTML = "Status";
      theadTr.appendChild(usdHeader2);

      thead.appendChild(theadTr);

      table.className = "table";
      table.appendChild(thead);

      clubs.decodedResult.forEach((valor, clave) => {
        var tbodyTr = document.createElement("tr");
        var contractTd = document.createElement("td");
        contractTd.innerHTML =
          "<a class='btn btn-success' onclick='changeProposal(" +
          valor.id +
          ")'>" +
          valor.id +
          "</a>";
        tbodyTr.appendChild(contractTd);
        var contractTickerTd = document.createElement("td");
        contractTickerTd.innerHTML = "<b>" + valor.description + "</b>";
        tbodyTr.appendChild(contractTickerTd);
        var balanceTd = document.createElement("td");
        balanceTd.innerHTML = "<b>" + Aeternity.toAe(valor.amount) + "</b>";
        tbodyTr.appendChild(balanceTd);
        var balanceUSDTd2 = document.createElement("td");
        balanceUSDTd2.innerHTML = "<b>" + valor.status + "</b>";
        tbodyTr.appendChild(balanceUSDTd2);
        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);

      list.appendChild(table);
    }
    $(".loading_message").css("display", "none");
  }
}

async function getMembers() {
  await getContract();
  if (contractPublic != undefined) {
    var clubId = localStorage.getItem("clubId");
    var club = await contractPublic.getClubById(clubId);
    if (club != null && club.decodedResult.members.size > 0) {
      var list = document.querySelector(".available_members");
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");

      var theadTr = document.createElement("tr");
      var balanceHeader = document.createElement("th");
      balanceHeader.innerHTML = "Account";
      theadTr.appendChild(balanceHeader);

      var balanceHeader2 = document.createElement("th");
      balanceHeader2.innerHTML = "Contributed Amount (in Æ)";
      theadTr.appendChild(balanceHeader2);

      thead.appendChild(theadTr);

      table.className = "table";
      table.appendChild(thead);

      club.decodedResult.members.forEach((valor, clave) => {
        var tbodyTr = document.createElement("tr");
        var contractTickerTd = document.createElement("td");
        contractTickerTd.innerHTML = "<b>" + clave + "</b>";
        tbodyTr.appendChild(contractTickerTd);
        var contractTickerTd2 = document.createElement("td");
        contractTickerTd2.innerHTML =
          "<b>" + Aeternity.toAe(valor.balance) + "</b>";
        tbodyTr.appendChild(contractTickerTd2);
        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);

      list.appendChild(table);
    }
    $(".loading_message").css("display", "none");
  }
}

function changeClub(clubId) {
  localStorage.setItem("clubId", clubId);
  window.location.href = "club.html";
}

function changeProposal(proposalId) {
  localStorage.setItem("proposalId", proposalId);
  window.location.href = "proposal.html";
}

async function verifyUserInClub() {
  var clubId = localStorage.getItem("clubId");
  var aeWalletAddress = localStorage.getItem("aeWalletAddress");
  if (clubId != null) {
    await getContract();
    if (contractPublic != undefined) {
      var user = await contractPublic.isUserInClub(aeWalletAddress, clubId);
      if (user.decodedResult) {
        $(".join_club").css("display", "none");
        $(".leave_club").css("display", "block");
      } else {
        $(".join_club").css("display", "block");
        $(".leave_club").css("display", "none");
      }
    }
  }
}

async function createProposal() {
  if (contractPublic != null) {
    var proposal_description = $("#proposal_description").val();
    var proposal_address = $("#proposal_address").val();
    var proposal_amount = $("#proposal_amount").val();
    var password = $("#trx_password").val();
    if (proposal_description == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Description is required");
      return;
    }
    if (proposal_address == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Destination address is required");
      return;
    }
    if (proposal_amount == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Amount is required");
      return;
    }
    if (password == "") {
      $("#errorCreateProposal").css("display", "block");
      $("#errorCreateProposal").text("Password is invalid");
      return;
    }
    var clubId = localStorage.getItem("clubId");
    var privateKey = CryptoJS.AES.decrypt(
      localStorage.getItem("aeWalletSecret"),
      password
    ).toString(CryptoJS.enc.Utf8);
    if (privateKey !== "") {
      const originWallet = new Aeternity.MemoryAccount(privateKey);
      await aeSdk.addAccount(originWallet, { select: true });
      $(".loading_message_creating").css("display", "block");
      proposal_amount = Aeternity.toAettos(proposal_amount);
      var proposalId = await contractPublic.createProposal(
        clubId,
        proposal_amount,
        proposal_address,
        proposal_description
      );
      $("#proposal_description").val("");
      $("#proposal_address").val("");
      $("#proposal_amount").val("");
      $("#trx_password").val("");
      $("#errorCreateProposal").css("display", "none");
      $(".loading_message_creating").css("display", "none");
      $("#successCreateProposal").css("display", "block");
      $("#successCreateProposal").text(
        "Proposal created successfully with id: " + proposalId.decodedResult
      );
    } else {
      $(".valid-feedback").css("display", "none");
      $(".loading_message_creating").css("display", "none");
      $(".invalid-feedback").css("display", "block");
      $(".invalid-feedback").text("The password is invalid");
    }
  }
}

async function createClub() {
  if (contractPublic != null) {
    var clubName = $("#club_name").val();
    var password = $("#trx_password").val();
    if (clubName == "") {
      $("#errorCreateClub").css("display", "block");
      $("#errorCreateClub").text("Club name is invalid");
      return;
    }
    if (password == "") {
      $("#errorCreateClub").css("display", "block");
      $("#errorCreateClub").text("Password is invalid");
      return;
    }

    var privateKey = CryptoJS.AES.decrypt(
      localStorage.getItem("aeWalletSecret"),
      password
    ).toString(CryptoJS.enc.Utf8);
    if (privateKey !== "") {
      const originWallet = new Aeternity.MemoryAccount(privateKey);
      await aeSdk.addAccount(originWallet, { select: true });
      $(".loading_message_creating").css("display", "block");
      var clubId = await contractPublic.createClub(clubName);
      $("#club_name").val("");
      $("#trx_password").val("");
      $("#errorCreateClub").css("display", "none");
      $(".loading_message_creating").css("display", "none");
      $("#successCreateClub").css("display", "block");
      $("#successCreateClub").text(
        "Club created successfully with id: " + clubId.decodedResult
      );
    } else {
      $(".valid-feedback").css("display", "none");
      $(".invalid-feedback").css("display", "block");
      $(".loading_message_creating").css("display", "none");
      $(".invalid-feedback").text("The password is invalid");
    }
  }
}

async function getClub() {
  var clubId = localStorage.getItem("clubId");
  if (clubId != null) {
    await getContract();
    if (contractPublic != undefined) {
      var club = await contractPublic.getClubById(clubId);
      if (club.decodedResult != null) {
        $(".club_name").text(club.decodedResult.name);
        $("#club_id").text(club.decodedResult.id);
        $(".club_members").text(club.decodedResult.members.size);
        $(".club_proposals").text(club.decodedResult.proposals.size);
        $(".club_balance").text(Aeternity.toAe(club.decodedResult.pool));
      }
    }
  }
}

async function joinClub() {
  $(".successJoinLeaveClub").css("display", "none");
  $(".errorJoinLeaveClub").css("display", "none");
  var clubId = localStorage.getItem("clubId");
  var password = $("#passwordShowPVJoin").val();
  if (password == "") {
    $(".successJoinLeaveClub").css("display", "none");
    $(".errorJoinLeaveClub").css("display", "block");
    $(".errorJoinLeaveClub").text("Password is invalid");
    return;
  }
  var privateKey = CryptoJS.AES.decrypt(
    localStorage.getItem("aeWalletSecret"),
    password
  ).toString(CryptoJS.enc.Utf8);
  if (privateKey !== "") {
    const originWallet = new Aeternity.MemoryAccount(privateKey);

    await aeSdk.addAccount(originWallet, { select: true });
    if (clubId != null) {
      $(".successJoinLeaveClub").css("display", "block");
      $(".successJoinLeaveClub").text("Joining the club...");
      await getContract();
      if (contractPublic != undefined) {
        await contractPublic.joinClub(clubId);
      }
    }
    $(".errorJoinLeaveClub").css("display", "none");
    $(".successJoinLeaveClub").css("display", "block");
    $(".successJoinLeaveClub").text("You have joined the club successfully");
    location.reload();
  } else {
    $(".successJoinLeaveClub").css("display", "none");
    $(".errorJoinLeaveClub").css("display", "block");
    $(".errorJoinLeaveClub").text("Password is invalid");
  }
}

async function leaveClub() {
  $(".successJoinLeaveClub").css("display", "none");
  $(".errorJoinLeaveClub").css("display", "none");
  var clubId = localStorage.getItem("clubId");
  var password = $("#passwordShowPVLeave").val();
  if (password == "") {
    $(".successJoinLeaveClub").css("display", "none");
    $(".errorJoinLeaveClub").css("display", "block");
    $(".errorJoinLeaveClub").text("Password is invalid");
    return;
  }
  var privateKey = CryptoJS.AES.decrypt(
    localStorage.getItem("aeWalletSecret"),
    password
  ).toString(CryptoJS.enc.Utf8);
  if (privateKey !== "") {
    const originWallet = new Aeternity.MemoryAccount(privateKey);

    await aeSdk.addAccount(originWallet, { select: true });
    if (clubId != null) {
      $(".successJoinLeaveClub").css("display", "block");
      $(".successJoinLeaveClub").text("Leaving the club...");
      await getContract();
      if (contractPublic != undefined) {
        await contractPublic.leaveClub(clubId);
      }
    }
    $(".errorJoinLeaveClub").css("display", "none");
    $(".successJoinLeaveClub").css("display", "block");
    $(".successJoinLeaveClub").text("You have left the club successfully");
    location.reload();
  } else {
    $(".successJoinLeaveClub").css("display", "none");
    $(".errorJoinLeaveClub").css("display", "block");
    $(".errorJoinLeaveClub").text("Password is invalid");
  }
}

async function contributeClub() {
  $(".successContributeClub").css("display", "none");
  $(".errorContributeClub").css("display", "none");
  var clubId = localStorage.getItem("clubId");
  var amountAE = $("#aeAmount").val();
  var password = $("#passwordShowPVContribute").val();
  if (amountAE == "" || amountAE <= 0) {
    $(".successContributeClub").css("display", "none");
    $(".errorContributeClub").css("display", "block");
    $(".errorContributeClub").text("Amount must be more than 0.");
    return;
  }
  if (password == "") {
    $(".successContributeClub").css("display", "none");
    $(".errorContributeClub").css("display", "block");
    $(".errorContributeClub").text("Password is invalid");
    return;
  }
  var privateKey = CryptoJS.AES.decrypt(
    localStorage.getItem("aeWalletSecret"),
    password
  ).toString(CryptoJS.enc.Utf8);
  if (privateKey !== "") {
    const originWallet = new Aeternity.MemoryAccount(privateKey);

    await aeSdk.addAccount(originWallet, { select: true });
    if (clubId != null) {
      $(".successContributeClub").css("display", "block");
      $(".successContributeClub").text("Contributing to the club...");
      await getContract();
      if (contractPublic != undefined) {
        amountAE = Aeternity.toAettos(amountAE);
        //await contractPublic.$call('contributeToClub', [clubId])
        try {
          await contractPublic.contributeToClub(clubId, {
            amount: amountAE,
            gasLimit: 1000000,
          });
        } catch (e) {
          $(".successContributeClub").css("display", "none");
          $(".errorContributeClub").css("display", "block");
          $(".errorContributeClub").text(e.toString());
          return;
        }
      }
    }
    $(".errorContributeClub").css("display", "none");
    $(".successContributeClub").css("display", "block");
    $(".successContributeClub").text(
      "You have contributed to the club successfully"
    );
    location.reload();
  } else {
    $(".successContributeClub").css("display", "none");
    $(".errorContributeClub").css("display", "block");
    $(".errorContributeClub").text("Password is invalid");
  }
}

async function getMyClubs() {
  await getContract();
  if (contractPublic != undefined) {
    var clubs = await contractPublic.listClubs();
    var myclubs = [];
    clubs.decodedResult.forEach((valor, clave) => {
      valor.members.forEach((valor1, clave1) => {
        valor1.address == localStorage.getItem("aeWalletAddress")
          ? myclubs.push(valor)
          : "";
      });
    });
    if (myclubs.length > 0) {
      var list = document.querySelector(".my_clubs");
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");

      var theadTr = document.createElement("tr");
      var balanceHeader = document.createElement("th");
      balanceHeader.innerHTML = "ID";
      theadTr.appendChild(balanceHeader);
      var contractNameHeader = document.createElement("th");
      contractNameHeader.innerHTML = "Name";
      theadTr.appendChild(contractNameHeader);
      var contractTickerHeader = document.createElement("th");
      contractTickerHeader.innerHTML = "Members";
      theadTr.appendChild(contractTickerHeader);

      var usdHeader = document.createElement("th");
      usdHeader.innerHTML = "Proposals";
      theadTr.appendChild(usdHeader);

      thead.appendChild(theadTr);

      table.className = "table";
      table.appendChild(thead);

      myclubs.forEach((valor) => {
        var tbodyTr = document.createElement("tr");
        var contractTd = document.createElement("td");
        contractTd.innerHTML =
          "<a class='btn btn-success' onclick='changeClub(" +
          valor.id +
          ")''>" +
          valor.id +
          "</a>";
        tbodyTr.appendChild(contractTd);
        var contractTickerTd = document.createElement("td");
        contractTickerTd.innerHTML = "<b>" + valor.name + "</b>";
        tbodyTr.appendChild(contractTickerTd);
        var balanceTd = document.createElement("td");
        balanceTd.innerHTML = "<b>" + valor.members.size + "</b>";
        tbodyTr.appendChild(balanceTd);
        var balanceUSDTd = document.createElement("td");
        balanceUSDTd.innerHTML = "<b>" + valor.proposals.size + "</b>";
        tbodyTr.appendChild(balanceUSDTd);
        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);

      list.appendChild(table);
    }
    $(".loading_message").css("display", "none");
  }
}

function saveAddressInStorage(address, secret, oldaddress, seed) {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  if (addresses != null) {
    addresses.push({
      address: address,
      key: secret,
      oldaddress: oldaddress,
      seed: seed,
    });
  } else {
    addresses = [];
    addresses.push({
      address: address,
      key: secret,
      oldaddress: oldaddress,
      seed: seed,
    });
  }
  localStorage.setItem("addresses", JSON.stringify(addresses));
}

function getFirstAddress() {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  return addresses[0];
}

async function generateWallet() {
  $("#creatingwallet").show();
  const my_wallet = Aeternity.generateKeyPair();
  if (my_wallet != null) {
    $("#new_address_generated").show();
    $("#aeAccount").text(my_wallet.publicKey);
    $("#aePrivateKey").text(my_wallet.secretKey);
    $("#creatingwallet").hide();
    $(".newWalletData").css("display", "block");
  }
  $(".loadingNewWalletDiv").css("display", "none");
}

function saveWallet() {
  var address = $("#aeAccount").text();
  var secret = $("#aePrivateKey").text();
  var password = $("#passwordRegisterAccount").val();
  //var encryptedAddress = CryptoJS.AES.encrypt(address, password);
  var encryptedSecret = CryptoJS.AES.encrypt(secret, password);
  localStorage.setItem("aeWalletAddress", address);
  localStorage.setItem("aeWalletSecret", encryptedSecret);

  confirmKeySaved();
}

function confirmKeySaved() {
  localStorage.authenticated = "true";
  location.href = "index.html";
}

function generateWalletFromPrivateKey() {
  const privateKey = $("#pvKeyValue").val();
  const password = $("#pvKeyNewPasswordValue").val();
  if (privateKey != "" && password != "") {
    const wallet = Aeternity.getAddressFromPriv(privateKey);
    localStorage.setItem("aeWalletAddress", wallet);
    var encryptedSecret = CryptoJS.AES.encrypt(privateKey, password);
    localStorage.setItem("aeWalletSecret", encryptedSecret);
    const account = new Aeternity.MemoryAccount(privateKey);
    aeSdk.addAccount(account);
    confirmKeySaved();
  } else {
    $("#errorLogin").css("display", "block");
    $("#errorLogin").text("The seed code and password must not be empty.");
  }
}

async function checkBalance() {
  const myWallet = localStorage.getItem("aeWalletAddress");
  try {
    var accountbalance = await aeSdk.getBalance(myWallet);
    if (accountbalance !== null && accountbalance !== undefined) {
      accountbalance = accountbalance / 1000000000000000000;
    }
    $(".view_balance_address").text(accountbalance);
  } catch {}
}

async function checkCurrentBlock() {
  const totalSupply = await iconServiceUtil.getTotalSupply().execute();
  $(".view_block_number").text(IconService.IconAmount.fromLoop(totalSupply));
}

function showPrivateKey() {
  var password = $("#passwordShowPV").val();
  try {
    var privateKey = CryptoJS.AES.decrypt(
      localStorage.getItem("aeWalletSecret"),
      password
    ).toString(CryptoJS.enc.Utf8);
    $("#privateKetShowed").text(privateKey);
  } catch (err) {
    alert("The password is wrong. Please, enter the right password.");
  }
  $("#passwordShowPV").val("");
  return false;
}

function logout() {
  localStorage.clear();
  location.href = "login.html";
}

$(function () {
  getContract();

  if (localStorage.getItem("aeWalletAddress") != null) {
    checkBalance();
    //checkCurrentBlock();
    const myWallet = localStorage.getItem("aeWalletAddress");
    $(".current_account_text").text(myWallet);
  }

  $("#saveWallet").click(function () {
    saveWallet();
  });

  $("#generateWalletButton").click(function () {
    generateWallet();
  });

  $("#generateWalletPrivKeyButton").click(function () {
    generateWalletFromPrivateKey();
  });

  $("#generateWalletKeyStoreButton").click(function () {
    generateWalletFromKeyStore();
  });

  $("#confirmKeySavedButton").click(function () {
    confirmKeySaved();
  });

  $("#verifyAddressButton").click(function () {
    checkAddress();
  });
  $("#btnLogout").click(function () {
    logout();
  });

  $("#btnLeaveClub").click(function () {
    leaveClub();
  });

  $("#btnContributeClub").click(function () {
    contributeClub();
  });

  $("#createClubButton").click(function () {
    createClub();
  });

  $("#btnJoinClub").click(function () {
    joinClub();
  });
  $("#createProposalButton").click(function () {
    createProposal();
  });

  $("#btnVote").click(function () {
    voteOnProposal();
  });

  $("#btnExecution").click(function () {
    runProposal();
  });

  $("#btnShowPrivateKey").click(function () {
    showPrivateKey();
  });
});
