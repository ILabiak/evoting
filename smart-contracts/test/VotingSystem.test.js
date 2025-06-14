const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function () {
  let voting;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    voting = await VotingSystem.deploy();
  });

  describe("createElection", function () {
    it("Створює голосування з негайним стартом", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);

      await voting.createElection("Голосування 1", true, 0);
      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].name).to.equal("Голосування 1");
      expect(elections[0].isActive).to.equal(true);
      expect(elections[0].startedManually).to.equal(true);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].name).to.equal("Голосування 1");
      expect(activeElections[0].id).to.equal(0);
      expect(activeElections[0].candidateCount).to.equal(0);
    });

    it("Створює голосування без старту", async function () {
      await voting.createElection("Голосування 2", false, 100);
      const elections = await voting.getAllElections();
      expect(elections.length).to.equal(1);
      expect(elections[0].isActive).to.equal(false);
      expect(elections[0].voterLimit).to.equal(100);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(0);
    });

    it("Отримання інформації про вибрані голосування за ID]", async () => {
      const ids = [0, 2, 5, 9];

      let elections = await voting.getElectionsByIds(ids);
      expect(elections.length).to.equal(0);

      for (let i = 0; i < 10; i++) {
        await voting.createElection(`Election ${i}`, false, 0);
      }

      elections = await voting.getElectionsByIds(ids);

      expect(elections.length).to.equal(4);
      for (let i = 0; i < ids.length; i++) {
        const election = elections[i];
        expect(election.id).to.equal(ids[i]);
        expect(election.name).to.equal(`Election ${ids[i]}`);
        expect(election.candidateCount).to.equal(0);
      }

      ids.unshift(123123);
      elections = await voting.getElectionsByIds(ids);
      console.log(elections);

      expect(elections.length).to.equal(4);
      expect(elections[0].name).to.equal(`Election 0`);
      expect(elections[1].name).to.equal(`Election 2`);
      expect(elections[2].name).to.equal(`Election 5`);
      expect(elections[3].name).to.equal(`Election 9`);
    });
  });

  describe("addCandidate", function () {
    it("Додає кандидатів до виборів", async function () {
      await voting.createElection("Голосування 1", true, 0);
      await voting.addCandidate(0, "Кандидат 1");
      await voting.addCandidate(0, "Кандидат 2");

      const all = await voting.getAllElections();
      expect(all[0].candidateCount).to.equal(2);
      expect(all[0].candidates[0].name).to.equal("Кандидат 1");
      expect(all[0].candidates[1].name).to.equal("Кандидат 2");

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].name).to.equal("Голосування 1");
      expect(activeElections[0].id).to.equal(0);
      expect(activeElections[0].candidateCount).to.equal(2);
      expect(activeElections[0].candidates[0].name).to.equal("Кандидат 1");
      expect(activeElections[0].candidates[1].name).to.equal("Кандидат 2");
      expect(activeElections[0].candidates.length).to.equal(2);
    });

    it("Забороняє додавати більше ніж MAX_CANDIDATES", async function () {
      await voting.createElection("Test", true, 0);

      for (let i = 0; i < 100; i++) {
        await voting.addCandidate(0, `Канд. ${i}`);
      }

      await expect(voting.addCandidate(0, "Перевищення")).to.be.revertedWith(
        "Max candidates"
      );
    });

    it("не дозволяє додати кандидатів з однаковим ім’ям у те саме голосування", async () => {
      await voting.createElection("Вибори", true, 0);

      await voting.addCandidate(0, "Іван Іванович");

      // Спроба додати кандидата з тим самим ім’ям має завершитися з помилкою
      await expect(voting.addCandidate(0, "Іван Іванович")).to.be.revertedWith(
        "Candidate name already exists"
      );
    });
  });

  describe("startElection / endElection", function () {
    it("Запускає і завершує голосування", async function () {
      await voting.createElection("Тест", false, 0);
      await voting.startElection(0);
      let all = await voting.getAllElections();
      // console.log('Election name:', all[0].name)
      expect(all[0].isActive).to.equal(true);

      await voting.endElection(0);
      all = await voting.getAllElections();
      expect(all[0].isActive).to.equal(false);
      expect(all[0].endedManually).to.equal(true);
    });
  });

  describe("stop/start election", function () {
    it("не дозволяє повторно запустити вибори після завершення", async function () {
      // Створення і запуск виборів
      await voting.createElection("Одноразові вибори", false, 0);
      await voting.addCandidate(0, "Кандидат X");

      // Запуск
      await voting.startElection(0);

      // Завершення
      await voting.endElection(0);

      // Спроба знову запустити вибори — має зафейлитись
      await expect(voting.startElection(0)).to.be.revertedWith(
        "Election has been already manually ended"
      );
    });
  });

  describe("vote", function () {
    beforeEach(async () => {
      await voting.createElection("Vote Test", true, 0);
      await voting.addCandidate(0, "Кандидат");
    });

    it("Дозволяє голосування одному користувачу", async function () {
      await voting.connect(user1).vote(0, 0);
      const elections = await voting.getAllElections();
      expect(elections[0].candidates[0].voteCount).to.equal(1);
    });

    it("Не дозволяє голосувати двічі", async function () {
      await voting.connect(user1).vote(0, 0);
      await expect(voting.connect(user1).vote(0, 0)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("Не дозволяє голосувати неактивні вибори", async function () {
      await voting.createElection("Інше", false, 0);
      await voting.addCandidate(1, "Канд.");
      await expect(voting.connect(user1).vote(1, 0)).to.be.revertedWith(
        "Election not active"
      );
    });

    it("Завершує вибори, якщо досягнуто ліміту голосів", async function () {
      await voting.createElection("Обмежене", true, 1);
      await voting.addCandidate(1, "Канд");

      await voting.connect(user1).vote(1, 0);
      const all = await voting.getAllElections();
      expect(all[1].isActive).to.equal(false);
      expect(all[1].endedManually).to.equal(true);
    });
  });

  describe("getMyVote", function () {
    it("Повертає правильний статус голосування", async function () {
      await voting.createElection("Голосування", true, 0);
      await voting.addCandidate(0, "Кандидат 1");

      const voteBefore = await voting.connect(user1).getMyVote(0);
      expect(voteBefore.hasVoted).to.equal(false);
      expect(voteBefore.candidateId).to.equal(ethers.MaxUint256);
      expect(voteBefore.candidateName).to.equal("");

      await voting.connect(user1).vote(0, 0);

      const voteAfter = await voting.connect(user1).getMyVote(0);
      expect(voteAfter.hasVoted).to.equal(true);
      expect(voteAfter.candidateId).to.equal(0);
      expect(voteAfter.candidateName).to.equal("Кандидат 1");
    });
  });

  describe("getResults", function () {
    it("Повертає результати після завершення виборів", async function () {
      await voting.createElection("Results", true, 1);
      await voting.addCandidate(0, "A");
      await voting.connect(user1).vote(0, 0);

      const results = await voting.getResults(0);
      expect(results[0].name).to.equal("A");
      expect(results[0].voteCount).to.equal(1);
    });

    it("Не повертає результати до завершення", async function () {
      await voting.createElection("Not ended", true, 0);
      await voting.addCandidate(0, "X");

      await expect(voting.getResults(0)).to.be.revertedWith(
        "Election not ended"
      );
    });
  });

  describe("voteWithSignature", function () {
    let electionId;

    beforeEach(async () => {
      await voting.createElection("Підписне голосування", true, 0);
      await voting.addCandidate(0, "Кандидат 1");
      electionId = 0;
    });

    it("Успішно голосує через підпис", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const packedData = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [electionId, candidateId, voterAddress]
      );

      const signature = await user1.signMessage(ethers.getBytes(packedData));

      // Голосує через підпис
      await voting
        .connect(user2)
        .voteWithSignature(electionId, candidateId, user1.address, signature);

      const elections = await voting.getAllElections();
      expect(elections[electionId].candidates[candidateId].voteCount).to.equal(
        1
      );
    });

    it("Не дозволяє голосувати двічі з підписом", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const packedData = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [electionId, candidateId, voterAddress]
      );

      const signature = await user1.signMessage(ethers.getBytes(packedData));

      await voting
        .connect(owner)
        .voteWithSignature(electionId, candidateId, user1.address, signature);

      // Повторне використання того ж підпису
      await expect(
        voting
          .connect(owner)
          .voteWithSignature(electionId, candidateId, user1.address, signature)
      ).to.be.revertedWith("Already voted");
    });

    it("Викидає помилку при фальшивому підписі", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const packedData = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [electionId, candidateId, voterAddress]
      );

      // user2 підписує повідомлення, але передаємо ніби це user1
      const fakeSignature = await user2.signMessage(
        ethers.getBytes(packedData)
      );

      await expect(
        voting
          .connect(owner)
          .voteWithSignature(
            electionId,
            candidateId,
            user1.address,
            fakeSignature
          )
      ).to.be.revertedWith("Invalid signature");
    });
  });
});
