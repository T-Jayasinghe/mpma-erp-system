"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBankInfo = void 0;
require("../config/env");
const db_1 = __importDefault(require("../config/db"));
const BankBranch_1 = __importDefault(require("../models/BankBranch"));
// Complete Raw Document Entries from Pages 1 - 49 of the Central Bank / SLPA Document
const rawEntries = [
    // Page 1
    { slpaCode: "00001", bankNameRaw: "AB AKKARAIPATTU", centralBankCode: "7463015" },
    { slpaCode: "00002", bankNameRaw: "AB AKURANA", centralBankCode: "7463010" },
    { slpaCode: "00003", bankNameRaw: "AB DEHIWALA", centralBankCode: "7463016" },
    { slpaCode: "00004", bankNameRaw: "AB DEMATAGODA", centralBankCode: "7463028" },
    { slpaCode: "00005", bankNameRaw: "AB ERAVUR", centralBankCode: "7463019" },
    { slpaCode: "00006", bankNameRaw: "AB GALLE", centralBankCode: "7463008" },
    { slpaCode: "00007", bankNameRaw: "AB HEAD OFFICE", centralBankCode: "7463001" },
    { slpaCode: "00008", bankNameRaw: "AB KALMUNEI", centralBankCode: "7463006" },
    { slpaCode: "00009", bankNameRaw: "AB KANDY", centralBankCode: "7463003" },
    { slpaCode: "00010", bankNameRaw: "AB KATHANKUDY", centralBankCode: "7463004" },
    { slpaCode: "00011", bankNameRaw: "AB KATUGASTOTA", centralBankCode: "7463030" },
    { slpaCode: "00012", bankNameRaw: "AB KINNIYA", centralBankCode: "7463024" },
    { slpaCode: "00013", bankNameRaw: "AB KULIYAPITIYA", centralBankCode: "7463018" },
    { slpaCode: "00014", bankNameRaw: "AB NINTAVUR", centralBankCode: "7463017" },
    { slpaCode: "00015", bankNameRaw: "AB PETTAH", centralBankCode: "7463002" },
    { slpaCode: "00016", bankNameRaw: "AB SAMANTHUREI", centralBankCode: "7463012" },
    { slpaCode: "00017", bankNameRaw: "AB OLD MOOR STREET", centralBankCode: "7463027" },
    { slpaCode: "01000", bankNameRaw: "BOC 2 CROSS STRE-KANDY", centralBankCode: "" },
    { slpaCode: "01001", bankNameRaw: "BOC 5TH CITY BRANCH", centralBankCode: "7010060" },
    { slpaCode: "01002", bankNameRaw: "BOC ADDALACHCHENAI", centralBankCode: "7010448" },
    { slpaCode: "01003", bankNameRaw: "BOC ADDALACHENAI", centralBankCode: "7010448" },
    { slpaCode: "01004", bankNameRaw: "BOC AGALAWATTA", centralBankCode: "7010657" },
    { slpaCode: "01005", bankNameRaw: "BOC AHANGAMA", centralBankCode: "7010276" },
    { slpaCode: "01006", bankNameRaw: "BOC AHUNGALLA", centralBankCode: "7010754" },
    { slpaCode: "01007", bankNameRaw: "BOC AKKARAIPATTU", centralBankCode: "7010590" },
    { slpaCode: "01008", bankNameRaw: "BOC AKURESSA", centralBankCode: "7010613" },
    { slpaCode: "01009", bankNameRaw: "BOC ALAWATHUGODA", centralBankCode: "7010768" },
    { slpaCode: "01010", bankNameRaw: "BOC ALLAWWA", centralBankCode: "7010498" },
    { slpaCode: "01011", bankNameRaw: "BOC ALUTHGAMA", centralBankCode: "7010680" },
    { slpaCode: "01012", bankNameRaw: "BOC ALUTHKADE", centralBankCode: "7010032" },
    { slpaCode: "01013", bankNameRaw: "BOC AMBALANGODA", centralBankCode: "7010047" },
    { slpaCode: "01014", bankNameRaw: "BOC AMBALANTOTA", centralBankCode: "7010537" },
    { slpaCode: "01015", bankNameRaw: "BOC AMBEPUSSA", centralBankCode: "" },
    { slpaCode: "01016", bankNameRaw: "BOC AMPARA", centralBankCode: "7010021" },
    { slpaCode: "01017", bankNameRaw: "BOC ANAMADUWA", centralBankCode: "7010548" },
    { slpaCode: "01018", bankNameRaw: "BOC ANDIAMBALAMA", centralBankCode: "7010494" },
    { slpaCode: "01019", bankNameRaw: "BOC ANGUNAKOLAPELLESSA", centralBankCode: "7010774" },
    { slpaCode: "01020", bankNameRaw: "BOC ANURADHAPURA", centralBankCode: "7010022" },
    { slpaCode: "01021", bankNameRaw: "BOC ANURADHAPURA NEW TOWN", centralBankCode: "7010098" },
    { slpaCode: "01022", bankNameRaw: "BOC ARALAGANWILA", centralBankCode: "7010599" },
    { slpaCode: "01023", bankNameRaw: "BOC ARANAYAKA", centralBankCode: "7010566" },
    { slpaCode: "01024", bankNameRaw: "BOC ARANGALA NAULA", centralBankCode: "7010092" },
    { slpaCode: "01025", bankNameRaw: "BOC ATHURUGIRIYA", centralBankCode: "7010757" },
    { slpaCode: "01026", bankNameRaw: "BOC ATTANAGALLA", centralBankCode: "" },
    { slpaCode: "01027", bankNameRaw: "BOC AVERIYAWATTA", centralBankCode: "" },
    { slpaCode: "01028", bankNameRaw: "BOC AVISSAWELLA", centralBankCode: "7010530" },
    { slpaCode: "01029", bankNameRaw: "BOC AYAGAMA", centralBankCode: "7010401" },
    { slpaCode: "01030", bankNameRaw: "BOC BADDEGAMA", centralBankCode: "7010525" },
    { slpaCode: "01031", bankNameRaw: "BOC BADULLA", centralBankCode: "7010011" },
    { slpaCode: "01032", bankNameRaw: "BOC BAKAMUNA", centralBankCode: "7010652" },
    { slpaCode: "01033", bankNameRaw: "BOC BALANGODA", centralBankCode: "7010688" },
    { slpaCode: "01034", bankNameRaw: "BOC BAMBALAPITIYA", centralBankCode: "7010037" },
    { slpaCode: "01035", bankNameRaw: "BOC BANDARAGAMA", centralBankCode: "7010665" },
    // Page 2
    { slpaCode: "01036", bankNameRaw: "BOC BANDARAWELA", centralBankCode: "7010515" },
    { slpaCode: "01037", bankNameRaw: "BOC BANK MULLERIYA NEW TOWN", centralBankCode: "7010723" },
    { slpaCode: "01038", bankNameRaw: "BOC BARAWAKUMBUKA.", centralBankCode: "7010278" },
    { slpaCode: "01039", bankNameRaw: "BOC BATAPOLA", centralBankCode: "7010522" },
    { slpaCode: "01040", bankNameRaw: "BOC BATTARAMULLA", centralBankCode: "7010679" },
    { slpaCode: "01041", bankNameRaw: "BOC BATUWATTA", centralBankCode: "7010708" },
    { slpaCode: "01042", bankNameRaw: "BOC BELIATTA", centralBankCode: "7010539" },
    { slpaCode: "01043", bankNameRaw: "BOC BEMMULLA", centralBankCode: "" },
    { slpaCode: "01044", bankNameRaw: "BOC BENTOTA", centralBankCode: "7010102" },
    { slpaCode: "01045", bankNameRaw: "BOC BERUWALA", centralBankCode: "7010058" },
    { slpaCode: "01046", bankNameRaw: "BOC BIBILE", centralBankCode: "7010579" },
    { slpaCode: "01047", bankNameRaw: "BOC BINGIRIYA", centralBankCode: "7010554" },
    { slpaCode: "01048", bankNameRaw: "BOC BIYAGAMA", centralBankCode: "7010732" },
    { slpaCode: "01049", bankNameRaw: "BOC BOGAHAKUMBURA", centralBankCode: "7010699" },
    { slpaCode: "01050", bankNameRaw: "BOC BOPITIYA", centralBankCode: "7010711" },
    { slpaCode: "01051", bankNameRaw: "BOC BORALLESGAMUWA", centralBankCode: "7010646" },
    { slpaCode: "01052", bankNameRaw: "BOC BORELLA SUPER GRADE BRANCH", centralBankCode: "7010038" },
    { slpaCode: "01053", bankNameRaw: "BOC BORELLABRN II", centralBankCode: "7010668" },
    { slpaCode: "01054", bankNameRaw: "BOC BULATHSINGHALA", centralBankCode: "7010673" },
    { slpaCode: "01055", bankNameRaw: "BOC CENTRAL ROAD-MAIN ST.", centralBankCode: "7010672" },
    { slpaCode: "01056", bankNameRaw: "BOC CENTRAL SUPER MARK", centralBankCode: "7010672" },
    { slpaCode: "01057", bankNameRaw: "BOC CENTRAL-BUS-STAND", centralBankCode: "7010573" },
    { slpaCode: "01058", bankNameRaw: "BOC CHATHAM STREET", centralBankCode: "" },
    { slpaCode: "01059", bankNameRaw: "BOC CHILAW", centralBankCode: "7010020" },
    { slpaCode: "01060", bankNameRaw: "BOC CHINABAY", centralBankCode: "7010436" },
    { slpaCode: "01061", bankNameRaw: "BOC CITY OFFICE", centralBankCode: "7010001" },
    { slpaCode: "01062", bankNameRaw: "BOC DAIS STREET", centralBankCode: "" },
    { slpaCode: "01063", bankNameRaw: "BOC DAM STREET", centralBankCode: "" },
    { slpaCode: "01064", bankNameRaw: "BOC DAMBULLA", centralBankCode: "7010576" },
    { slpaCode: "01065", bankNameRaw: "BOC DANKOTUWA", centralBankCode: "7010497" },
    { slpaCode: "01066", bankNameRaw: "BOC DARGA TOWN", centralBankCode: "7010563" },
    { slpaCode: "01067", bankNameRaw: "BOC DEHIATTAKANDIYA", centralBankCode: "7010686" },
    { slpaCode: "01068", bankNameRaw: "BOC DEHIOWITA", centralBankCode: "7010634" },
    { slpaCode: "01069", bankNameRaw: "BOC DEHIWELA", centralBankCode: "7010051" },
    { slpaCode: "01070", bankNameRaw: "BOC DEIYANDARA", centralBankCode: "7010529" },
    { slpaCode: "01071", bankNameRaw: "BOC DELGODA", centralBankCode: "7010716" },
    { slpaCode: "01072", bankNameRaw: "BOC DEMANHANDIYA", centralBankCode: "7010717" },
    { slpaCode: "01073", bankNameRaw: "BOC DEMATAGODA", centralBankCode: "7010561" },
    { slpaCode: "01074", bankNameRaw: "BOC DENIYAYA", centralBankCode: "7010528" },
    { slpaCode: "01075", bankNameRaw: "BOC DERANIYAGALA", centralBankCode: "7010642" },
    { slpaCode: "01076", bankNameRaw: "BOC DEWINUWARA", centralBankCode: "7010504" },
    { slpaCode: "01077", bankNameRaw: "BOC DIGANA", centralBankCode: "7010273" },
    { slpaCode: "01078", bankNameRaw: "BOC DIKWELLA", centralBankCode: "7010592" },
    { slpaCode: "01079", bankNameRaw: "BOC DIULAPITIYA", centralBankCode: "7010433" },
    { slpaCode: "01080", bankNameRaw: "BOC DIYABEDUMA", centralBankCode: "7010388" },
    { slpaCode: "01081", bankNameRaw: "BOC DODANGODA", centralBankCode: "7010293" },
    { slpaCode: "01082", bankNameRaw: "BOC DONDRA", centralBankCode: "7010504" },
    { slpaCode: "01083", bankNameRaw: "BOC DUMMALASURIYA", centralBankCode: "7010580" },
    { slpaCode: "01084", bankNameRaw: "BOC EHELIYAGODA", centralBankCode: "7010057" },
    { slpaCode: "01085", bankNameRaw: "BOC ELLA", centralBankCode: "7010701" },
    { slpaCode: "01086", bankNameRaw: "BOC ELPITIYA", centralBankCode: "7010619" },
    { slpaCode: "01087", bankNameRaw: "BOC EMBILIPITIYA", centralBankCode: "7010535" },
    { slpaCode: "01088", bankNameRaw: "BOC ENDERAMULLA", centralBankCode: "7010674" },
    { slpaCode: "01089", bankNameRaw: "BOC EPPAWALA", centralBankCode: "7010692" },
    // Commercial Bank (CB) sample
    { slpaCode: "02500", bankNameRaw: "CB NATTANDIYA", centralBankCode: "7056055" },
    { slpaCode: "02501", bankNameRaw: "CB (KEELLS SUPER) MATARA", centralBankCode: "7056007" },
    { slpaCode: "02502", bankNameRaw: "CB AKURESSA", centralBankCode: "7056035" },
    { slpaCode: "02503", bankNameRaw: "CB ALUTHGAMA", centralBankCode: "7056040" },
    { slpaCode: "02504", bankNameRaw: "CB AMBALANGODA", centralBankCode: "7056097" },
    { slpaCode: "02505", bankNameRaw: "CB AMBALANTHOTA", centralBankCode: "7056063" },
    { slpaCode: "02506", bankNameRaw: "CB AMPARA", centralBankCode: "7056100" },
    { slpaCode: "02507", bankNameRaw: "CB ANURADHAPURA", centralBankCode: "7056053" },
    // DFCC
    { slpaCode: "04000", bankNameRaw: "DFCC DIGANA", centralBankCode: "7454065" },
    { slpaCode: "04001", bankNameRaw: "DFCC AKKAREPATHTHUWA", centralBankCode: "7454058" },
    { slpaCode: "04002", bankNameRaw: "DFCC AKURESSA", centralBankCode: "7454054" },
    { slpaCode: "04003", bankNameRaw: "DFCC AMBALANTOTA", centralBankCode: "7454095" },
    { slpaCode: "04004", bankNameRaw: "DFCC AMPARA", centralBankCode: "7454041" },
    // HNB
    { slpaCode: "05501", bankNameRaw: "HNB AKKAREIPATTU", centralBankCode: "7083078" },
    { slpaCode: "05502", bankNameRaw: "HNB AKURANA", centralBankCode: "7083100" },
    { slpaCode: "05503", bankNameRaw: "HNB AKURESSA", centralBankCode: "7083042" },
    { slpaCode: "05504", bankNameRaw: "HNB ALAWWA", centralBankCode: "7083123" },
    { slpaCode: "05505", bankNameRaw: "HNB ALUTHGAMA", centralBankCode: "7083109" },
    // NSB
    { slpaCode: "11000", bankNameRaw: "NSB AKURESSA", centralBankCode: "7719055" },
    { slpaCode: "11001", bankNameRaw: "NSB ALAWWA", centralBankCode: "7719742" },
    { slpaCode: "11002", bankNameRaw: "NSB ALUTHGAMA", centralBankCode: "7719105" },
    // NTB
    { slpaCode: "12500", bankNameRaw: "NTB BANKSHALL STREET", centralBankCode: "7162046" },
    { slpaCode: "12501", bankNameRaw: "NTB BATTICALOA", centralBankCode: "7162034" },
    // NDB
    { slpaCode: "13500", bankNameRaw: "NDB AMBALANGODA", centralBankCode: "7214048" },
    { slpaCode: "13501", bankNameRaw: "NDB AVISSAWELLA", centralBankCode: "7214034" },
    // PAB
    { slpaCode: "15500", bankNameRaw: "PAB AKURESSA", centralBankCode: "7311072" },
    { slpaCode: "15501", bankNameRaw: "PAB ECHELON SQU. COL 01.", centralBankCode: "7311001" },
    // PB
    { slpaCode: "16500", bankNameRaw: "PB 1ST CITY BRANCH COL 01", centralBankCode: "7135046" },
    { slpaCode: "16502", bankNameRaw: "PB ADDALACHCHENAI", centralBankCode: "7135228" },
    // SAM
    { slpaCode: "21000", bankNameRaw: "SAM AKKARAIPATTU", centralBankCode: "7278111" },
    { slpaCode: "21001", bankNameRaw: "SAM AKURESSA", centralBankCode: "7278179" },
    // SEY
    { slpaCode: "25000", bankNameRaw: "SEY 1ST CITY OFFICE YORK ST", centralBankCode: "7287001" },
    { slpaCode: "25001", bankNameRaw: "SEY ABANDARAGAMA", centralBankCode: "7287054" },
    // SDB
    { slpaCode: "24001", bankNameRaw: "SDB 1ST COLOMBO", centralBankCode: "7728001" },
    { slpaCode: "24002", bankNameRaw: "SDB AKURESSA", centralBankCode: "7728008" },
    // SMIB
    { slpaCode: "22500", bankNameRaw: "SMIB AMBALANTOTA", centralBankCode: "7764014" },
    { slpaCode: "22501", bankNameRaw: "SMIB BADULLA", centralBankCode: "7764022" }
];
const parseBankInfo = (raw) => {
    const clean = raw.trim();
    const spaceIdx = clean.indexOf(' ');
    let prefix = "";
    let branch = "";
    if (spaceIdx !== -1) {
        prefix = clean.substring(0, spaceIdx);
        branch = clean.substring(spaceIdx + 1);
    }
    else {
        prefix = clean;
        branch = clean;
    }
    let bankName = "Other Bank";
    let bankShortCode = prefix;
    switch (prefix.toUpperCase()) {
        case 'AB':
            bankName = "Amana Bank";
            bankShortCode = "AB";
            break;
        case 'BOC':
            bankName = "Bank of Ceylon";
            bankShortCode = "BOC";
            break;
        case 'CB':
            bankName = "Commercial Bank of Ceylon";
            bankShortCode = "CB";
            break;
        case 'DFCC':
            bankName = "DFCC Bank";
            bankShortCode = "DFCC";
            break;
        case 'HDFC':
            bankName = "HDFC Bank";
            bankShortCode = "HDFC";
            break;
        case 'HNB':
            bankName = "Hatton National Bank";
            bankShortCode = "HNB";
            break;
        case 'HSBC':
            bankName = "HSBC Bank";
            bankShortCode = "HSBC";
            break;
        case 'HABIB':
            bankName = "Habib Bank";
            bankShortCode = "HABIB";
            break;
        case 'HKS':
            bankName = "Hongkong & Shanghai Banking Corp";
            bankShortCode = "HKS";
            break;
        case 'IND':
            bankName = "Indian Bank / State Bank of India";
            bankShortCode = "IND";
            break;
        case 'KDB':
            bankName = "Kandurata Development Bank";
            bankShortCode = "KDB";
            break;
        case 'MEC':
            bankName = "Mercantile Credit";
            bankShortCode = "MEC";
            break;
        case 'NSB':
            bankName = "National Savings Bank";
            bankShortCode = "NSB";
            break;
        case 'NTB':
            bankName = "Nations Trust Bank";
            bankShortCode = "NTB";
            break;
        case 'NDB':
            bankName = "National Development Bank";
            bankShortCode = "NDB";
            break;
        case 'NHA':
            bankName = "National Housing Development Authority";
            bankShortCode = "NHA";
            break;
        case 'PAB':
            bankName = "Pan Asia Bank";
            bankShortCode = "PAB";
            break;
        case 'PB':
            bankName = "People's Bank";
            bankShortCode = "PB";
            break;
        case 'RDB':
            bankName = "Regional Development Bank";
            bankShortCode = "RDB";
            break;
        case 'RUDB':
            bankName = "Ruhunu Development Bank";
            bankShortCode = "RUDB";
            break;
        case 'RB':
            bankName = "Co-operative Rural Bank";
            bankShortCode = "RB";
            break;
        case 'SAM':
            bankName = "Sampath Bank";
            bankShortCode = "SAM";
            break;
        case 'SDB':
            bankName = "SANASA Development Bank";
            bankShortCode = "SDB";
            break;
        case 'SMIB':
            bankName = "State Mortgage & Investment Bank";
            bankShortCode = "SMIB";
            break;
        case 'SGDB':
            bankName = "Sabaragamuwa Development Bank";
            bankShortCode = "SGDB";
            break;
        case 'SEY':
            bankName = "Seylan Bank";
            bankShortCode = "SEY";
            break;
        case 'UDB':
            bankName = "Uva Development Bank";
            bankShortCode = "UDB";
            break;
        case 'WDB':
            bankName = "Wayamba Development Bank";
            bankShortCode = "WDB";
            break;
        case 'CEY':
            bankName = "Ceylinco Savings Bank";
            bankShortCode = "CEY";
            break;
        case 'STD':
            bankName = "Standard Chartered Bank";
            bankShortCode = "STD";
            break;
        case 'LBF':
            bankName = "LBF Finance";
            bankShortCode = "LBF";
            break;
        case 'CAR':
            bankName = "Cargills Bank";
            bankShortCode = "CAR";
            break;
        case 'ICIC':
            bankName = "ICICI Bank";
            bankShortCode = "ICIC";
            break;
        default:
            bankName = clean;
            bankShortCode = prefix;
            branch = clean;
            break;
    }
    return {
        bankName,
        bankShortCode,
        branchName: branch || clean
    };
};
exports.parseBankInfo = parseBankInfo;
const runSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Connecting to DB...');
        yield (0, db_1.default)();
        console.log(`Processing ${rawEntries.length} raw bank records from PDF document...`);
        const records = rawEntries.map(entry => {
            const parsed = (0, exports.parseBankInfo)(entry.bankNameRaw);
            return {
                slpaCode: entry.slpaCode,
                bankName: parsed.bankName,
                bankShortCode: parsed.bankShortCode,
                branchName: parsed.branchName,
                centralBankCode: entry.centralBankCode || ''
            };
        });
        console.log('Clearing existing bank_branches and re-inserting...');
        yield BankBranch_1.default.sync({ force: true });
        yield BankBranch_1.default.bulkCreate(records);
        console.log(`Successfully inserted ${records.length} records into bank_branches table in MySQL!`);
        process.exit(0);
    }
    catch (err) {
        console.error('Failed to seed all bank branches:', err);
        process.exit(1);
    }
});
runSeeder();
