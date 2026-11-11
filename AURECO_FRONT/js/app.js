(function(){
'use strict';
const DAY=86400000;
const SCHOOL='Africa University';
const LOGO_SRC='assets/logo.png';
const KEY='spw_proto_v2', SKEY='spw_session_v2';
const DEMO_PW='demo1234';
const CODE='123456';

/* ---------- helpers ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const first=n=>String(n).split(' ')[0];
const initials=n=>String(n).split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const fmtD=ts=>new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const fmtDL=ts=>new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const sameDay=(a,b)=>a.toDateString()===b.toDateString();
function fmtWhen(ts){const d=new Date(ts),t=new Date();if(sameDay(d,t))return 'Today, '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});if(sameDay(d,new Date(Date.now()-DAY)))return 'Yesterday';return fmtD(ts)}
const daysTo=ts=>Math.ceil((ts-Date.now())/DAY);
const uid=p=>p+'_'+Math.random().toString(36).slice(2,9);
const plural=(n,w,pl)=>n+' '+(n===1?w:(pl||w+'s'));
const link=u=>{u=(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;try{return new URL(u).href}catch(e){return ''}};
const todayISO=()=>new Date().toISOString().slice(0,10);
function dueLabel(ts){const n=daysTo(ts);if(n<0)return `<span class="chip bad">⏱ Overdue by ${plural(-n,'day')}</span>`;if(n<=14)return `<span class="chip bad">⏱ Due in ${plural(n,'day')}</span>`;return `<span class="muted">Due ${fmtD(ts)}</span>`}

/* ---------- grades & transcript model ---------- */
const AU_WEIGHTS={
  'A':4.00,'A-':3.70,'B+':3.50,'B':3.20,'B-':2.90,
  'C+':2.50,'C':2.00,'C-':1.70,'D+':1.30,'D':1.00,'F':0.00
};
const AU_GRADE_LIST=['A','A-','B+','B','B-','C+','C','C-','D+','D','F'];
const SAMPLE_AU_SEM1=[
  {code:'CSC1101',name:'Principles of Programming Languages',credits:12.00,weight:2.90,grade:'B-'},
  {code:'CSC1102',name:'Theory of Computing',credits:12.00,weight:4.00,grade:'A'},
  {code:'CSC1103',name:'Calculus',credits:12.00,weight:4.00,grade:'A'},
  {code:'HUM1102',name:'French for Beginners I',credits:12.00,weight:3.20,grade:'B'},
  {code:'SOE1101',name:'Object Oriented Software Development',credits:12.00,weight:3.50,grade:'B+'}
];
const CAT=[
 [['Principles of Programming Languages','CSC1101'],['Theory of Computing','CSC1102'],['Calculus','CSC1103'],['French for Beginners I','HUM1102'],['Object Oriented Software Development','SOE1101']],
 [['Data Structures & Algorithms','CSC1201'],['Discrete Mathematics','MTH1202'],['Computer Architecture & Organisation','CSC1203'],['French for Beginners II','HUM1202'],['Web Technologies','SOE1201']],
 [['Operating Systems','CSC2101'],['Linear Algebra','MTH2101'],['Database Management Systems','CSC2103'],['Software Requirements Engineering','SOE2101'],['Probability & Statistics','STA2101']],
 [['Software Design & Architecture','SOE2201'],['Computer Networks & Data Comm','CSC2202'],['Mobile Application Development','SOE2203'],['Professional Ethics & Christian Values','HUM2201'],['Operations Research','MTH2204']],
 [['Compiler Construction','CSC3101'],['Artificial Intelligence','CSC3102'],['Software Testing & Quality Assurance','SOE3101'],['IT Project Management','BUS3101'],['Human Computer Interaction','SOE3103']],
 [['Machine Learning','CSC3201'],['Distributed & Cloud Computing','CSC3202'],['Information Security & Cryptography','CSC3204'],['Numerical Methods','MTH3201'],['Industrial Attachment Prep','SOE3205']],
 [['Final Year Software Project I','SOE4101'],['Big Data Analytics','CSC4102'],['DevOps & Enterprise Systems','SOE4103'],['AI & Society','CSC4105']],
 [['Dissertation / Capstone Project','SOE4201'],['Advanced Database Systems','CSC4202'],['Technopreneurship & Innovation','BUS4201'],['Special Topics in Software Engineering','SOE4204']]
];
const CREDITS=[60,60,60,60,60,60,48,48];
const LAD=[['F',0.00],['D',1.00],['D+',1.30],['C-',1.70],['C',2.00],['C+',2.50],['B-',2.90],['B',3.20],['B+',3.50],['A-',3.70],['A',4.00]];

function getTranscriptMap(){
  if(!S.finals)S.finals={};
  if(!S.finals.__transcripts)S.finals.__transcripts={};
  return S.finals.__transcripts;
}
function getStudentTranscript(u){
  if(!u)return null;
  const map=getTranscriptMap();
  const tr=u.transcript||map[u.schoolId]||map[u.id];
  if(tr&&Array.isArray(tr.semesters)&&tr.semesters.length)return tr;
  // Automatic exact match for sample PDF student (250933 / Mushayapokuvaka)
  if(u.schoolId==='250933'||/mushayapokuvaka/i.test(u.name||'')){
    return {
      dob:'09/04/2003',sex:'-',nationality:'-',specialisation:'-',
      admissionYear:'AUG25',completionYear:'-',refNo:'TRN-2026-000589',
      semesters:[{label:'Sem-1',courses:clone(SAMPLE_AU_SEM1)}]
    };
  }
  return tr||null;
}
function fullProgramName(prog){
  const p=String(prog||'').trim();
  if(!p)return 'Bachelor of Science Honours in Software Engineering';
  if(/^BSc\s+/i.test(p))return p.replace(/^BSc\s+/i,'Bachelor of Science Honours in ');
  return p;
}
function formatTranscriptName(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(parts.length<=1)return parts[0]||'';
  const last=parts[parts.length-1].toUpperCase();
  const firsts=parts.slice(0,-1).join(' ');
  return `${firsts}\n${last}`;
}
function defaultSemCourses(u,i){
  if(i===0&&(u.schoolId==='250933'||/mushayapokuvaka/i.test(u.name||'')||Math.abs((u.gpas&&u.gpas[0]||0)-3.52)<0.015)){
    return clone(SAMPLE_AU_SEM1);
  }
  const catSem=CAT[i]||CAT[0];
  const targetGpa=(u.gpas&&u.gpas[i]!=null)?Number(u.gpas[i]):3.40;
  let remCr=catSem.length*12, remPts=targetGpa*remCr;
  return catSem.map((c,j)=>{
    const cr=12.00;
    const want=remPts/remCr;
    const b=LAD.reduce((a,x)=>Math.abs(x[1]-want)<Math.abs(a[1]-want)?x:a);
    remCr-=cr;
    remPts-=b[1]*cr;
    return {code:c[1],name:c[0],credits:cr,weight:b[1],grade:b[0],points:b[1]};
  });
}
function semCount(u){
  const tr=getStudentTranscript(u);
  if(tr&&Array.isArray(tr.semesters)&&tr.semesters.length)return tr.semesters.length;
  return (u&&Array.isArray(u.gpas))?u.gpas.length:0;
}
function courses(u,i){
  const tr=getStudentTranscript(u);
  if(tr&&Array.isArray(tr.semesters)&&tr.semesters[i]&&Array.isArray(tr.semesters[i].courses)){
    return tr.semesters[i].courses.map(c=>{
      const cr=Number(c.credits)||12;
      const gr=String(c.grade||'B').trim().toUpperCase();
      const wt=(c.weight!==undefined&&c.weight!==''&&!isNaN(Number(c.weight)))?Number(c.weight):(AU_WEIGHTS[gr]!==undefined?AU_WEIGHTS[gr]:3.0);
      return {code:c.code||'CSC1101',name:c.name||'Course',credits:cr,weight:wt,grade:gr,points:wt};
    });
  }
  return defaultSemCourses(u,i);
}
function semStats(u,i){
  const c=courses(u,i);
  const credits=c.reduce((a,x)=>a+(Number(x.credits)||0),0);
  const weighted=c.reduce((a,x)=>a+(Number(x.credits)||0)*(Number(x.weight!=null?x.weight:x.points)||0),0);
  const gpa=credits>0?Math.round((weighted/credits)*100)/100:0;
  return {credits:Math.round(credits*100)/100,weighted:Math.round(weighted*100)/100,gpa};
}
function cumStats(u,upTo){
  const n=upTo!==undefined?upTo+1:semCount(u);
  let credits=0,weighted=0;
  for(let i=0;i<n;i++){
    const st=semStats(u,i);
    credits+=st.credits;
    weighted+=st.weighted;
  }
  const cgpa=credits>0?Math.round((weighted/credits)*100)/100:(u&&u.overall!=null?Number(u.overall):0);
  return {credits:Math.round(credits*100)/100,weighted:Math.round(weighted*100)/100,cgpa};
}
function semGpa(u,i){return semStats(u,i).gpa}
const creditsDone=u=>cumStats(u).credits;
const fmt2=n=>Number(n||0).toFixed(2);

/* ---------- seed ---------- */
function seed(){
  let ph=100;
  const stu=(id,name,sid,year,prog,overall,gpas,extra)=>Object.assign({id,role:'student',name,schoolId:sid,email:name.toLowerCase().replace(/ /g,'.')+'@students.school.edu',phone:'+263 77 '+(++ph)+' '+(4000+ph),password:DEMO_PW,year,programme:prog,status:'active',overall,gpas,bio:'',skills:[],linkedin:'',github:'',photo:null},extra||{});
  const staff=(id,hon,name,title,dept,email,teaches,status)=>({id,role:'staff',hon,name,title,dept,email,teaches,password:DEMO_PW,status:status||'active',photo:null});
  const startJ=Date.now()-37*DAY, startC=Date.now()-68*DAY;
  const att=(start)=>({supId:'u_casey',company:'Acme Ltd',start,end:start+84*DAY});
  const users=[
    stu('u_jordan','Jordan Lee','2023-0148',3,'BSc Computer Science',3.41,[3.12,3.35,3.55,3.45,3.65,3.52],{phone:'+263 77 123 4567',bio:"Third-year Computer Science student who enjoys building tools that save people time. Strong in databases and web development. I'm looking for a software developer role after I graduate.",skills:['Python','SQL','JavaScript','Git'],linkedin:'linkedin.com/in/jordanlee',github:'github.com/jordanlee',attach:att(startJ)}),
    stu('u_sam','Sam Patel','2023-0152',3,'BSc Computer Science',3.28,[3.0,3.2,3.3,3.4,3.35,3.4],{bio:'Third-year student interested in data and mobile apps.',skills:['Java','Kotlin','SQL'],linkedin:'linkedin.com/in/sampatel',github:'github.com/sampatel',attach:att(startJ)}),
    stu('u_alex','Alex Carter','2024-0310',2,'BSc Information Systems',3.15,[3.0,3.1,3.3,3.2],{bio:'Second-year Information Systems student.',skills:['Excel','SQL']}),
    stu('u_taylor','Taylor Kim','2023-0201',3,'BSc Computer Science',3.55,[3.4,3.5,3.6,3.7,3.6,3.5],{bio:'Final-year project lead who likes teamwork and clean code.',skills:['Python','React','Git'],linkedin:'linkedin.com/in/taylorkim',github:'github.com/taylorkim'}),
    stu('u_casen','Casey Nguyen','2022-0077',4,'BSc Computer Science',3.62,[3.3,3.4,3.5,3.6,3.7,3.7,3.8],{bio:'Fourth-year student who enjoys backend work.',skills:['Go','PostgreSQL','Docker'],linkedin:'linkedin.com/in/caseynguyen',github:'github.com/caseynguyen',attach:att(startC)}),
    stu('u_tendai','Tendai Sibanda','2024-0188',2,'BSc Computer Science',3.22,[3.1,3.2,3.3,3.3],{bio:'Second-year student.',skills:['Python']}),
    stu('u_nomsa','Nomsa Dube','2025-0301',1,'BSc Information Systems',3.05,[3.0,3.1],{}),
    stu('u_farai','Farai Moyo','2025-0302',1,'BSc Computer Science',3.0,[3.0,3.0],{}),
    staff('u_riley','Dr.','Riley Adams','Lecturer','Computing','riley.adams@school.edu',['u_jordan','u_sam','u_alex','u_taylor','u_casen','u_tendai']),
    staff('u_jamie','Ms.','Jamie Ortiz','Teacher','Communication','jamie.ortiz@school.edu',['u_jordan','u_alex']),
    staff('u_morgan','Prof.','Morgan Hughes','Lecturer','Mathematics','morgan.hughes@school.edu',['u_jordan','u_sam']),
    staff('u_dana','Dr.','Dana Whitfield','Lecturer','Mathematics','dana.whitfield@school.edu',[],'deactivated'),
    {id:'u_casey',role:'supervisor',name:'Casey Brooks',company:'Acme Ltd',dept:'Software team',email:'casey.brooks@acme.example',password:DEMO_PW,status:'active',photo:null},
    {id:'u_farai_econet',role:'supervisor',name:'Eng. Farai Chirume',company:'Econet Wireless Zimbabwe',dept:'Core Network & Digital Platforms',email:'careers@econet.co.zw',password:DEMO_PW,status:'active',photo:null},
    {id:'u_au_scholarships',role:'admin',name:'AU Financial Aid Office',dept:'Scholarships & Financial Aid',email:'scholarships@africau.edu',password:DEMO_PW,status:'active',photo:null},
    staff('u_simba_muronda','Prof.','Simba Muronda','Lecturer','Innovation Hub & CS','innovation@africau.edu',['u_jordan','u_sam','u_taylor']),
    {id:'u_quinn',role:'admin',name:'Quinn Moyer',dept:'Registry office',email:'quinn.moyer@school.edu',password:DEMO_PW,status:'active',photo:null},
    {id:'u_robin',role:'student',name:'Robin Hale',schoolId:'2025-0412',email:'robin.hale@students.school.edu',phone:'+263 77 555 0412',password:DEMO_PW,year:1,programme:'',status:'pending',overall:null,gpas:[],bio:'',skills:[],linkedin:'',github:'',photo:null,signup:{match:true,issues:[],at:Date.now()-DAY}},
    {id:'u_drew',role:'student',name:'Drew Sato',schoolId:'2025-0413',email:'drew.sato@mail.com',phone:'+263 77 555 0413',password:DEMO_PW,year:1,programme:'',status:'pending',overall:null,gpas:[],bio:'',skills:[],linkedin:'',github:'',photo:null,signup:{match:false,issues:['Records list drew.s@students.school.edu, but they entered drew.sato@mail.com.'],at:Date.now()-DAY}}
  ];
  const registry=users.filter(u=>u.role==='student').map(u=>({schoolId:u.schoolId,name:u.name,email:u.id==='u_drew'?'drew.s@students.school.edu':u.email,year:u.year,programme:u.programme}));
  registry.push({schoolId:'2026-0501',name:'Mia Dube',email:'mia.dube@students.school.edu',year:1,programme:'BSc Information Systems'},{schoolId:'2026-0502',name:'Kudzai Ncube',email:'kudzai.ncube@students.school.edu',year:1,programme:'BSc Computer Science'});
  let n=0;const A=(sid,type,year,title,where,status,age,comments)=>({id:'a'+(++n),sid,type,year,title,where:where||'',status,created:Date.now()-age*DAY,evidence:'',comments:comments||[]});
  const acts=[
    A('u_jordan','achievement',3,"Dean's list",'Faculty of Science','verified',60),
    A('u_jordan','achievement',2,'Hackathon finalist','Inter-university','verified',300),
    A('u_jordan','achievement',1,'Best first-year project','Computing department','verified',600),
    A('u_jordan','leadership',3,'Chess club treasurer',"Students' union",'waiting',45,[{by:'u_riley',text:'Please add a letter from the club president.',at:Date.now()-20*DAY}]),
    A('u_jordan','leadership',2,'Class representative','Computing','verified',350),
    A('u_jordan','leadership',2,'Peer mentor','First-year mentoring programme','verified',320),
    A('u_jordan','extra',3,'Debate society','Member, years 1 to 3','verified',90),
    A('u_jordan','extra',1,'Football, first team','University sport','verified',550),
    A('u_jordan','extra',2,'Photography club','Member','waiting',5),
    A('u_sam','achievement',3,'Programming contest, second place','Regional contest','waiting',3),
    A('u_sam','leadership',2,'Student council secretary','','verified',200),
    A('u_sam','extra',1,'Basketball','Campus league','verified',500),
    A('u_alex','leadership',2,'Volunteer tutor','Maths support desk','waiting',40),
    A('u_alex','extra',1,'Drama club','','verified',400),
    A('u_taylor','achievement',2,'Faculty prize','Computing','verified',300),
    A('u_taylor','leadership',3,'Hackathon team lead','','verified',100),
    A('u_taylor','extra',1,'Robotics club','','verified',500),
    A('u_casen','achievement',3,'Dean\'s list','','verified',200),
    A('u_casen','leadership',3,'Coding club president','','verified',150),
    A('u_casen','extra',2,'Cycling','','verified',300),
    A('u_tendai','achievement',1,'First-year merit award','','verified',400),
    A('u_nomsa','extra',1,'Choir','','waiting',10)
  ];
  const P=(sid,name,kind,goal,challenge,role,result,live,code)=>({id:uid('p'),sid,name,kind,goal,challenge,role,result,live:live||'',code:code||'',comments:[]});
  const projects=[
    P('u_jordan','Student results portal','Class project · Team of 4','Let lecturers upload marks and let students see them.','Marks pages loaded slowly. I added a database index and cut the load time from 6 seconds to 2.','I built the database and the login system. Two teammates built the screens, one wrote tests.','Used by 3 classes, 120 students','https://example.com/results','https://github.com/jordanlee/results-portal'),
    P('u_jordan','Clinic booking app','Freelance · Solo','Help a small clinic stop double-booking patients.','Two people booked the same slot. I chose to lock a slot the moment someone starts booking it.','I did everything: design, code and set-up.','Missed appointments down by a third','https://example.com/clinic','https://github.com/jordanlee/clinic-booking'),
    P('u_jordan','Budget tracker','Personal build · Solo','Track monthly spending without a spreadsheet.','Syncing between phone and laptop. I used a small sync queue.','Solo build.','Used daily for 8 months','','https://github.com/jordanlee/budget'),
    P('u_jordan','Library catalogue search','Class project · Team of 3','Help students find books faster than the old card list.','Searches were slow on long titles. I tried two methods and picked the faster one.','Team of 3. I wrote the search and the database.','Searches take under 1 second. Used by 200 students.','',''),
    P('u_sam','Step counter app','Personal build · Solo','Count steps and show weekly trends.','Battery use was high; I batched sensor reads.','Solo.','Battery use down 40%','','https://github.com/sampatel/steps'),
    P('u_sam','Campus map','Class project · Team of 3','A simple map of lecture rooms.','Offline use; cached tiles.','Wrote the search.','Used by 80 students','',''),
    P('u_alex','Inventory sheet','Class project · Solo','Track stock for a small shop.','','','','',''),
    P('u_taylor','Team scheduler','Class project · Team of 4','Fair timetable for group work.','','Led the team.','Used by 4 classes','',''),
    P('u_taylor','Portfolio site','Personal build · Solo','Show my work.','','Solo.','','',''),
    P('u_taylor','Final-year project','Final-year · Team of 4','Real-time lab booking.','Handling clashes.','Led a team of four.','Delivered ahead of schedule','',''),
    P('u_casen','Log shipper','Personal build · Solo','Ship logs cheaply.','','Solo.','Cut costs by half','',''),
    P('u_casen','Chat service','Class project · Team of 3','Scalable chat.','','Backend.','Handled 5k users in tests','',''),
    P('u_casen','Warehouse API','Attachment · Solo','Stock API for a client.','','Solo.','In use','',''),
    P('u_tendai','Quiz game','Class project · Team of 2','A study quiz.','','','','','')
  ];
  const bodyV1='Dear hiring manager,\n\nIt is my pleasure to recommend Taylor Kim for the software internship. In my databases class they showed strong problem-solving skills.\n\nI am confident they would be a valuable team member.\n\nYours sincerely,\nDr. Riley Adams';
  const draftV2='Dear hiring manager,\n\nIt is my pleasure to recommend Taylor Kim for the software internship. In my databases class they showed strong problem-solving skills.\n\nIn their final-year project, Taylor led a team of four and delivered a working system ahead of schedule.\n\nI am confident they would be a valuable team member.\n\nYours sincerely,\nDr. Riley Adams';
  const share={grades:true,ach:true,lead:true,extra:true};
  const L=(sid,staffId,purpose,due,status,o)=>Object.assign({id:uid('l'),sid,staffId,purpose,due,note:'',share:clone(share),status,reply:'',versions:[],changeRequests:[],changesUsed:0,draft:'',created:Date.now()-5*DAY},o||{});
  const letters=[
    L('u_jordan','u_riley','Internship',Date.now()+20*DAY,'ready',{versions:[{n:1,body:'Dear hiring manager,\n\nI am pleased to recommend Jordan Lee for a software internship. In my databases class Jordan built the strongest project of the year, and they led the team with care and good humour.\n\nI recommend them without reservation.\n\nYours sincerely,\nDr. Riley Adams',sent:Date.now()-3*DAY,seen:false}],note:"I'm applying for a software internship at a local bank."}),
    L('u_jordan','u_morgan','Scholarship',Date.now()+30*DAY,'accepted'),
    L('u_jordan','u_jamie','Job application',Date.now()+17*DAY,'declined',{reply:"I'm on leave this term. Please ask another lecturer."}),
    L('u_jordan','u_riley','Scholarship',Date.now()+10*DAY,'waiting',{note:'I would like my leadership in the chess club mentioned.'}),
    L('u_sam','u_riley','Job application',Date.now()+27*DAY,'waiting'),
    L('u_taylor','u_riley','Internship',Date.now()+15*DAY,'changes',{versions:[{n:1,body:bodyV1,sent:Date.now()-13*DAY,seen:true}],changesUsed:1,changeRequests:[{text:'Please mention my final-year project and how I led the team.',at:Date.now()-DAY}],draft:draftV2}),
    L('u_alex','u_riley','Scholarship',Date.now()-3*DAY,'waiting')
  ];
  const notes=[
    {sid:'u_jordan',wk:4,r:{punct:5,qual:3,team:4},text:'Started the reports page. Needs a clearer plan.',at:startJ+27*DAY,by:'u_casey'},
    {sid:'u_jordan',wk:5,r:{punct:5,qual:4,team:5},text:'Settled in well. Asks good questions.',at:startJ+34*DAY,by:'u_casey'},
    {sid:'u_sam',wk:5,r:{punct:4,qual:4,team:4},text:'Steady progress on the mobile client.',at:startJ+34*DAY,by:'u_casey'},
    {sid:'u_casen',wk:9,r:{punct:5,qual:5,team:5},text:'Delivered the stock API and wrote the handover notes.',at:startC+62*DAY,by:'u_casey'}
  ];
  return {v:2,users,registry,acts,projects,letters,notes,finals:{},
    assess:[{sid:'u_jordan',by:'u_riley',r:{leadership:4,teamwork:5,communication:3},feedback:'Jordan led the club well this year. Next, try delegating more tasks.',at:Date.now()-10*DAY}],
    perms:defaultPerms(),permLog:[{ts:Date.now()-DAY,by:'Quinn Moyer',text:'Permissions changed for Lecturers'},{ts:Date.now()-20*DAY,by:'Quinn Moyer',text:'Teachers can now comment on portfolios'}],
    log:[{ts:Date.now()-3600000,text:'Registry updated Year 2 grades'},{ts:Date.now()-DAY,text:'Permissions changed for Lecturers'},{ts:Date.now()-DAY,text:'2 students signed up'}],
    reports:[{id:'r1',name:'Year 3 progress',fmt:'PDF',ts:Date.now()-20*DAY,f:{'rep.type':'progress','rep.group':'3','rep.grades':true,'rep.credits':true,'rep.acts':true,'rep.comp':true}},{id:'r2',name:'Compliance summary',fmt:'Excel',ts:Date.now()-32*DAY,f:{'rep.type':'compliance','rep.group':'all'}}]
  };
}

/* ---------- permissions ---------- */
const PROLES=['student','teacher','lecturer','supervisor','administrator'];
const PLABEL={student:'Student',teacher:'Teacher',lecturer:'Lecturer',supervisor:'Supervisor',administrator:'Administrator'};
const N=null;
const PROWS=[
 {g:'Portfolios'},
 {k:'view_own',l:'View their own portfolio',why:'Students always see their own portfolio. This is fixed by the school.',c:[[1,1],N,N,N,N]},
 {k:'add_projects',l:'Add projects and edit their profile',c:[[1,0],N,N,N,N]},
 {k:'view_taught',l:'View portfolios of students they teach or supervise',c:[N,[1,0],[1,0],[1,0],N]},
 {k:'view_all',l:"View every student's portfolio",why:'Only administrators can be given access to every portfolio. Other roles only see students linked to them.',c:[[0,1],[0,1],[0,1],[0,1],[1,0]]},
 {k:'add_acts',l:'Add activities and achievements',c:[[1,0],N,N,N,N]},
 {k:'verify',l:'Check (verify) entries',why:'Students cannot verify their own entries. This is fixed by the school.',c:[[0,1],[1,0],[1,0],[0,0],[0,0]]},
 {k:'comment_rate',l:'Comment on and rate portfolios',why:'Students cannot rate their own portfolio. This is fixed by the school.',c:[[0,1],[1,0],[1,0],[0,0],[0,0]]},
 {k:'add_notes',l:'Add attachment progress notes',why:'Students cannot write their own progress notes. This is fixed by the school.',c:[[0,1],[0,0],[0,0],[1,0],[0,0]]},
 {k:'change_gpa',l:'Change certified GPA and grades',why:'Grades are entered by the registry office and certified. Nobody can edit them here.',c:[[0,1],[0,1],[0,1],[0,1],[0,1]]},
 {g:'Letters'},
 {k:'ask_letter',l:'Ask for a recommendation letter',c:[[1,0],N,N,N,N]},
 {k:'write_letters',l:'Write recommendation letters',why:'Students cannot write their own letters. This is fixed by the school.',c:[[0,1],[1,0],[1,0],[0,0],[0,0]]},
 {g:'People and reports'},
 {k:'manage_accounts',l:'Create and manage accounts',why:'Only administrators manage accounts, and they always keep this access.',c:[[0,1],[0,1],[0,1],[0,1],[1,1]]},
 {k:'change_perms',l:'Change permissions',why:'Only administrators change permissions, and they always keep this access.',c:[[0,1],[0,1],[0,1],[0,1],[1,1]]},
 {k:'see_reports',l:'See the dashboard and reports',why:'Students cannot see school-wide reports. This is fixed by the school.',c:[[0,1],[0,0],[0,0],[0,0],[1,1]]}
];
function defaultPerms(){const p={};PROWS.forEach(r=>{if(!r.k)return;p[r.k]={};PROLES.forEach((role,i)=>{const c=r.c[i];p[r.k][role]=c?{v:!!c[0],lock:!!c[1]}:null})});return p}
function permRole(u){return u.role==='student'?'student':u.role==='staff'?(u.title==='Teacher'?'teacher':'lecturer'):u.role==='supervisor'?'supervisor':'administrator'}

/* ---------- state ---------- */
function load(){if(AU_CONFIG.USE_BACKEND)return window.__AU_BOOT_STATE||null;try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&s.v===2)return s}}catch(e){}return null}
function save(){if(AU_CONFIG.USE_BACKEND){AuAPI.pushState(S);return}try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function loadSes(){try{const r=sessionStorage.getItem(SKEY)||localStorage.getItem(SKEY);if(r)return JSON.parse(r)}catch(e){}return null}
function saveSes(keep){try{sessionStorage.removeItem(SKEY);localStorage.removeItem(SKEY);if(SES){const j=JSON.stringify(SES);(keep?localStorage:sessionStorage).setItem(SKEY,j)}}catch(e){}}
let S=load()||seed();
let SES=loadSes();
let F={},NEXT={},ui={err:{}};
const live={},actions={},submits={};
const user=id=>S.users.find(u=>u.id===id);
const me=()=>{const u=SES&&user(SES.uid);return u&&u.status==='active'?u:null};
const students=()=>S.users.filter(u=>u.role==='student'&&u.status==='active');
const staffLabel=u=>u?((u.hon?u.hon+' ':'')+u.name):'External Recommender';
function can(key){const u=me();if(!u)return false;const perms=(SES&&SES.perms)||S.perms;const c=perms[key]&&perms[key][permRole(u)];return !!(c&&c.v)}
function need(key){if(can(key))return true;toast("Your role doesn't have this permission. The administrator can change it under Permissions.",'bad');return false}
function addLog(text){S.log.unshift({ts:Date.now(),text});S.log=S.log.slice(0,30)}
const myActs=sid=>S.acts.filter(a=>a.sid===sid);
const myProjects=sid=>S.projects.filter(p=>p.sid===sid);
const isComplete=sid=>myProjects(sid).length>0&&['achievement','leadership','extra'].every(t=>myActs(sid).some(x=>x.type===t));
const TYPES={achievement:'School achievements',leadership:'Leadership roles',extra:'Extracurricular'};
const TYPE1={achievement:'School achievement',leadership:'Leadership role',extra:'Extracurricular'};
const FNAME=(u)=>u?(u.role==='staff'?staffLabel(u):u.name):'External';
const OLD=30*DAY;
const oldEntries=()=>S.acts.filter(a=>a.status!=='verified'&&Date.now()-a.created>OLD&&user(a.sid)&&user(a.sid).status==='active');
const openLetters=l=>['waiting','accepted','changes'].includes(l.status);
const overdueLetters=()=>S.letters.filter(l=>openLetters(l)&&l.due<Date.now());

/* ---------- UI helpers ---------- */
const app=document.getElementById('app');
function toast(msg,kind){const t=document.getElementById('toast');const d=document.createElement('div');d.className='toast '+(kind||'');d.textContent=msg;t.appendChild(d);setTimeout(()=>{try{d.remove()}catch(e){}},kind==='bad'?6000:4200)}
const fv=(k,d)=>F[k]!==undefined?F[k]:(d==null?'':d);
function fld(k,o){o=o||{};const err=ui.err[k],id='f_'+k.replace(/\W/g,'_'),val=fv(k,o.def);
  const at=`id="${id}" data-k="${k}" ${o.lv?`data-live="${o.lv}"`:''} ${o.ph?`placeholder="${esc(o.ph)}"`:''} ${o.max?`maxlength="${o.max}"`:''} ${o.auto?`autocomplete="${o.auto}"`:''} ${o.min?`min="${o.min}"`:''} ${err?`aria-invalid="true" aria-describedby="${id}_e"`:''}`;
  const ctl=o.ta?`<textarea ${at} rows="${o.rows||3}">${esc(val)}</textarea>`:`<input type="${o.type||'text'}" ${at} value="${esc(val)}">`;
  return `<div class="field ${err?'has-err':''}"><label for="${id}">${o.label}</label>${ctl}${o.hint?`<div class="hint">${o.hint}</div>`:''}${err?`<div class="errmsg" id="${id}_e">${esc(err)}</div>`:''}</div>`}
function selF(k,opts,o){o=o||{};const id='f_'+k.replace(/\W/g,'_'),err=ui.err[k],val=fv(k,o.def);
  return `<div class="field ${err?'has-err':''}">${o.label?`<label for="${id}">${o.label}</label>`:''}<select id="${id}" data-k="${k}" ${o.r?'data-r="1"':''} ${o.lv?`data-live="${o.lv}"`:''}>${opts.map(op=>{const [v,l]=Array.isArray(op)?op:[op,op];return `<option value="${esc(v)}" ${String(val)===String(v)?'selected':''}>${esc(l)}</option>`}).join('')}</select>${o.hint?`<div class="hint">${o.hint}</div>`:''}${err?`<div class="errmsg">${esc(err)}</div>`:''}</div>`}
function chk(k,label,def,r){const v=F[k]!==undefined?F[k]:!!def;return `<label class="chk"><input type="checkbox" data-k="${k}" ${r?'data-r="1"':''} ${v?'checked':''}><span>${label}</span></label>`}
function tabs(k,items,def,live_){const cur=fv(k,def);return `<div class="tabs" role="group">${items.map(([v,l])=>`<button type="button" data-a="setF" data-k="${k}" data-v="${esc(v)}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div>`}
function ratings(k,def){const cur=Number(fv(k,def))||0;return `<div class="rating" role="group">${[1,2,3,4,5].map(n=>`<button type="button" data-a="rate" data-k="${k}" data-v="${n}" aria-pressed="${cur===n}" aria-label="${n}">${n}</button>`).join('')}</div>`}
function avatar(u,size,edit){const inner=u.photo?`<img src="${u.photo}" alt="">`:`<span>${esc(initials(u.name))}</span>`;return `<div class="avatar" style="--s:${size||56}px">${inner}${edit?`<button class="cam" data-a="photo" data-id="${u.id}" aria-label="Change profile photo" title="Change photo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></button>`:''}</div>`}
const logo=()=>`<span class="logo"><img src="${LOGO_SRC}" alt="Africa University logo"></span>`;
const crumbs=a=>`<div class="crumbs">${a.map(([l,h])=>h?`<a href="#${h}">${esc(l)}</a>`:esc(l)).join(' › ')}</div>`;
const fail=()=>{ui.focusErr=true;render()};
function openModal(title,body,o){ui.modal=Object.assign({title,body},o||{});renderModal()}
function closeModal(){ui.modal=null;renderModal()}
function renderModal(){const m=document.getElementById('modal');if(!ui.modal){m.innerHTML='';return}
  m.innerHTML=`<div class="backdrop" data-bd="1"><div class="modal ${ui.modal.wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="mhead"><h2 id="mt">${esc(ui.modal.title)}</h2><button class="x" data-a="closeModal" aria-label="Close">✕</button></div><div class="mbody">${ui.modal.body()}</div></div></div>`;
  const f=m.querySelector('input,select,textarea,.btn');if(f&&f.focus)try{f.focus()}catch(e){}}
function go(p,next){NEXT=next||{};if(location.hash==='#'+p){F=Object.assign({},NEXT);NEXT={};ui={err:{}};render()}else location.hash=p}

/* ---------- dark / light toggle ---------- */
const TKEY='au_theme';
function getTheme(){try{const t=localStorage.getItem(TKEY);if(t==='dark'||t==='light')return t}catch(e){}return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function applyTheme(t){document.documentElement.dataset.theme=t;document.body.classList.toggle('dark-theme',t==='dark')}
applyTheme(getTheme());
const themeBtn=()=>`<button type="button" class="linkbtn" data-a="theme">${getTheme()==='dark'?'☀ Light mode':'☾ Dark mode'}</button>`;
actions.theme=()=>{const t=getTheme()==='dark'?'light':'dark';applyTheme(t);try{localStorage.setItem(TKEY,t)}catch(e){}render()};
/* ---------- projects: tab filter ---------- */
const PCAT={'Class project':'class','Personal build':'personal','Freelance':'work','Attachment':'work','Final-year project':'major','Hackathon':'major'};
const PCATS=[['all','All'],['class','Class'],['personal','Personal'],['work','Freelance and attachment'],['major','Final-year and hackathon']];
const projCat=p=>PCAT[(p.kind||'').split(' · ')[0]]||'other';
function applyProjFilter(animate){const cat=fv('pr.cat','all');document.querySelectorAll('[data-a="projFilter"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===cat)));let shown=0;
  document.querySelectorAll('.pfilter').forEach(it=>{const ok=cat==='all'||it.dataset.category===cat;if(ok)shown++;
    if(!animate){it.hidden=!ok;it.classList.remove('fade');return}
    if(ok){if(it.hidden||it.classList.contains('fade')){it.classList.add('fade');it.hidden=false;void it.offsetWidth;it.classList.remove('fade')}}
    else{it.classList.add('fade');setTimeout(()=>{if(it.classList.contains('fade'))it.hidden=true},180)}});
  const em=document.getElementById('pfEmpty');if(em)em.hidden=shown>0}
actions.projFilter=el=>{F['pr.cat']=el.dataset.v;applyProjFilter(true)};
live.projFilter=()=>applyProjFilter(false);
/* ---------- shell ---------- */
const NAV={student:[['Home',''],['My grades','/grades'],['My projects','/projects'],['My activities','/activities'],['My letters','/letters'],['Opportunities','/opportunities']],staff:[['Home',''],['My students','/students'],['Letter requests','/letters'],['Opportunities','/opportunities']],supervisor:[['Home',''],['My students','/students'],['Opportunities','/opportunities']],admin:[['Home',''],['People','/people'],['Permissions','/permissions'],['Reports','/reports'],['Opportunities','/opportunities']]};
const SIDE_TITLE={student:'My portfolio',staff:'Staff portal',supervisor:'Supervisor',admin:'Admin'};
function shell(u,body){const base='/'+u.role,cur=location.hash.replace(/^#/,'');
  const items=NAV[u.role].map(([l,p])=>{const on=p===''?cur===base:cur.startsWith(base+p);return `<a href="#${base+p}" class="nav-i ${on?'on':''}" ${on?'aria-current="page"':''}>${l}</a>`}).join('');
  return `<div class="shell"><aside class="side"><div class="brand">${logo()}<span style="line-height:1.2"><b>Africa University</b><br><span class="muted small">${SIDE_TITLE[u.role]}</span></span></div><nav aria-label="Main">${items}</nav><div class="side-foot"><span>${esc(u.name)}</span>${themeBtn()}<button class="linkbtn" data-a="changePasswordModal">Change password</button><button class="linkbtn" data-a="logout">Log out</button></div></aside><main class="main" id="main">${body}</main></div>`}

/* ---------- auth: log in ---------- */
const ROLE_LABEL={student:'Student',staff:'Staff',supervisor:'Supervisor',admin:'Administrator'};
function loginPage(){
  const role=fv('login.role','student');
  const demos=[['student','Jordan Lee','2023-0148'],['staff','Dr. Riley Adams','riley.adams@school.edu'],['supervisor','Casey Brooks','casey.brooks@acme.example'],['admin','Quinn Moyer','quinn.moyer@school.edu']];
  const hint={student:'School email or school ID',staff:'School email',supervisor:'Work email',admin:'School email'}[role];
  return `<div class="auth"><div class="authbox"><div style="text-align:right;margin-bottom:8px">${themeBtn()}</div><div class="authcard"><div class="logo">${logo().replace(/^<span class="logo">|<\/span>$/g,'')}</div><h1>Sign in to your portfolio</h1><p class="muted" style="text-align:center;margin:2px 0 18px">${SCHOOL}</p>
   <div class="seg" role="group" aria-label="I am a">${Object.entries(ROLE_LABEL).map(([r,l])=>`<button type="button" data-a="loginRole" data-v="${r}" aria-pressed="${r===role}">${l}</button>`).join('')}</div>
   ${ui.err.login?`<div class="banner bad mb" role="alert">${esc(ui.err.login)}</div>`:''}
   <form data-submit="login" novalidate>
    ${fld('login.id',{label:hint,ph:role==='student'?'name@students.school.edu or 2023-0148':'name@school.edu',auto:'username'})}
    <div class="field ${ui.err['login.pw']?'has-err':''}"><label for="f_login_pw">Password</label><div class="pw"><input id="f_login_pw" type="password" data-k="login.pw" value="${esc(fv('login.pw'))}" autocomplete="current-password"><button type="button" data-a="togglePw">Show</button></div>${ui.err['login.pw']?`<div class="errmsg">${esc(ui.err['login.pw'])}</div>`:''}</div>
    <div class="row between mb">${chk('login.keep','Keep me signed in')}<button type="button" class="linkbtn" data-a="forgot">Forgot password?</button></div>
    <button class="btn pri" style="width:100%" type="submit">Sign in as ${ROLE_LABEL[role].toLowerCase()}</button>
   </form>
   ${role==='student'?`<p style="text-align:center;margin-top:16px" class="muted">New student? <a href="#/signup"><b>Create an account</b></a></p>`:`<p class="muted small" style="text-align:center;margin-top:16px;border-top:1px solid var(--line);padding-top:14px">Staff, supervisors and administrators: accounts are created by the school. Supervisors sign in with their work email and password.</p>`}
  </div>
  ${AU_CONFIG.USE_BACKEND?'':`<div class="demo"><b>Prototype demo accounts</b> (password for all: ${DEMO_PW})<div class="row">${demos.map(([r,n,id])=>`<button type="button" class="btn sm" data-a="fillDemo" data-r="${r}" data-id="${id}">${n}</button>`).join('')}</div>
  <p class="small" style="margin-top:10px">Everything you do is saved in this browser only, so you can switch between roles and see how they work together. <button class="linkbtn" data-a="resetDemo">Reset demo data</button></p></div>`}</div></div>`}
actions.loginRole=el=>{F['login.role']=el.dataset.v;ui.err={};render()};
actions.togglePw=el=>{const i=el.parentElement.querySelector('input');const show=i.type==='password';i.type=show?'text':'password';el.textContent=show?'Hide':'Show'};
actions.fillDemo=el=>{F['login.role']=el.dataset.r;F['login.id']=el.dataset.id;F['login.pw']=DEMO_PW;ui.err={};render()};
actions.resetDemo=()=>{try{localStorage.removeItem(KEY)}catch(e){}S=seed();SES=null;saveSes();F={};ui={err:{}};render();toast('Demo data reset.')};
actions.forgot=()=>openModal('Reset your password',()=>`<p class="mb">Enter your school email. We will send a link to reset your password.</p>${fld('forgot.email',{label:'School email',type:'email',ph:'name@school.edu'})}<div class="row"><button class="btn pri" data-a="sendReset">Send reset link</button><button class="btn" data-a="closeModal">Cancel</button></div>`);
actions.sendReset=()=>{const v=fv('forgot.email').trim();if(!/^\S+@\S+\.\S+$/.test(v)){ui.err['forgot.email']='Enter a valid email, like name@school.edu.';renderModal();return}ui.err={};closeModal();toast('If that email belongs to an account, a reset link is on its way. (Prototype: no email is actually sent.)')};

/* Change password modal */
actions.changePasswordModal=(required)=>{
  F['cp.pw']='';F['cp.pw2']='';ui.err={};
  openModal('Set your personal password',()=>{
    return `${required===true?'<div class="banner info mb"><b>Security notice:</b> You signed in with a temporary default password. Please choose a new personal password below.</div>':''}
      <form data-submit="doChangePassword" novalidate>
        ${fld('cp.pw',{label:'New password',type:'password',ph:'At least 8 characters',auto:'new-password'})}
        ${fld('cp.pw2',{label:'Confirm new password',type:'password',ph:'Re-enter new password',auto:'new-password'})}
        <div class="row mt">
          <button class="btn pri" type="submit">Save new password</button>
          ${required===true?'':`<button type="button" class="btn" data-a="closeModal">Cancel</button>`}
        </div>
      </form>`;
  });
};
submits.doChangePassword=()=>{
  const p1=fv('cp.pw').trim(),p2=fv('cp.pw2').trim();
  ui.err={};
  if(!p1||p1.length<8)ui.err['cp.pw']='Password must be at least 8 characters.';
  if(p1!==p2)ui.err['cp.pw2']="Passwords don't match.";
  if(Object.keys(ui.err).length)return renderModal();
  if(AU_CONFIG.USE_BACKEND){
    AuAPI.changePassword(p1,p2).then(()=>{
      const u=me();if(u)u.mustChangePassword=false;
      closeModal();
      toast('Your password has been updated.');
    }).catch(e=>{
      ui.err['cp.pw']=(e&&e.message)||'Could not update password.';
      renderModal();
    });
  } else {
    const u=me();if(u){u.password=p1;u.mustChangePassword=false;save()}
    closeModal();
    toast('Your password has been updated.');
  }
};

submits.login=()=>{if(AU_CONFIG.USE_BACKEND)return loginRemote();
  const role=fv('login.role','student'),id=fv('login.id').trim().toLowerCase(),pw=fv('login.pw');ui.err={};
  if(!id)ui.err['login.id']='Enter your school email or school ID.';
  if(!pw)ui.err['login.pw']='Enter your password.';
  if(Object.keys(ui.err).length)return fail();
  const u=S.users.find(x=>x.email.toLowerCase()===id||(x.schoolId&&x.schoolId.toLowerCase()===id));
  if(!u||u.password!==pw){ui.err.login="We couldn't find an account with those details. Check your email or ID and password, then try again.";return fail()}
  F['login.role'] = u.role;
  const msg={pending:"Your sign-up is waiting for the administrator to approve it. You can sign in once it's approved.",correction:'The administrator asked you to correct your details. Create your account again using the details the school holds for you.',rejected:'This sign-up was not approved. Contact the registry office for help.',deactivated:'This account has been deactivated. Contact the registry office to have it turned back on.'}[u.status];
  if(msg){ui.err.login=msg;return fail()}
  SES={uid:u.id,perms:clone(S.perms)};saveSes(!!fv('login.keep'));F={};ui={err:{}};go('/'+u.role);
  if(u.mustChangePassword){setTimeout(()=>actions.changePasswordModal(true), 400);}
};
actions.logout=()=>{
  if(AU_CONFIG.USE_BACKEND){
    if(AuAPI.flush) AuAPI.flush();
    AuAPI.logout();
    S=seed();
  }
  SES=null;saveSes();F={};ui={err:{}};location.hash='#/login';render();
};

/* backend login: the server checks the password and returns a token; the app then loads its data */
function loginRemote(){const role=fv('login.role','student'),id=fv('login.id').trim(),pw=fv('login.pw'),keep=!!fv('login.keep');ui.err={};
  if(!id)ui.err['login.id']='Enter your school email or school ID.';
  if(!pw)ui.err['login.pw']='Enter your password.';
  if(Object.keys(ui.err).length)return fail();
  AuAPI.login(role,id,pw,keep).then(r=>AuAPI.fetchState().then(st=>{
    S=st;
    const u=user(r.userId);
    SES={uid:r.userId,perms:clone(S.perms)};
    saveSes(keep);
    F={};
    ui={err:{}};
    const effRole = (u && u.role) || r.role || role;
    F['login.role'] = effRole;
    go('/' + effRole);
    if(r.mustChangePassword||(u&&u.mustChangePassword)){
      setTimeout(()=>actions.changePasswordModal(true), 400);
    }
  }))
   .catch(e=>{AuAPI.clearToken();ui.err.login=(e&&e.message)||'We could not sign you in. Check your connection and try again.';fail()})}
AuAPI.onError=msg=>toast(msg,'bad');
AuAPI.onUnauthorized=()=>{if(SES){SES=null;saveSes();S=seed();ui={err:{}};location.hash='#/login';render();toast('Your session has ended. Please sign in again.','bad')}};

/* ---------- auth: sign up ---------- */
const pwScore=p=>[p.length>=8,/\d/.test(p),/[^A-Za-z0-9]/.test(p),p.length>=12].filter(Boolean).length;
live.pw=()=>{const el=document.getElementById('pwbar');if(!el)return;const s=pwScore(fv('su.pw'));el.style.width=(fv('su.pw')?s*25:0)+'%';el.style.background=s<=1?'var(--bad)':s<3?'var(--warn)':'var(--ok)'};
function signupPage(){
  const su=ui.su||{stage:'form'};let inner;
  const role=fv('su.role','student');
  if(su.stage==='form'){
    const studentForm=`
      <p class="muted" style="text-align:center;margin:2px 0 16px">Use the details Africa University has on file for you.</p>
      <form data-submit="signup" novalidate>
        ${fld('su.id',{label:'School ID',ph:'2023-0148',auto:'off'})}
        ${fld('su.email',{label:'School email',type:'email',ph:'name@students.school.edu',hint:"We'll send a verification code here.",auto:'email'})}
        ${fld('su.phone',{label:'Phone number',type:'tel',ph:'+263 77 123 4567',auto:'tel'})}
        <div class="field ${ui.err['su.pw']?'has-err':''}"><label for="f_su_pw">Create password</label><div class="pw"><input id="f_su_pw" type="password" data-k="su.pw" data-live="pw" value="${esc(fv('su.pw'))}" autocomplete="new-password"><button type="button" data-a="togglePw">Show</button></div><div class="strength" aria-hidden="true"><i id="pwbar"></i></div><div class="hint">At least 8 characters, one number, one symbol.</div>${ui.err['su.pw']?`<div class="errmsg">${esc(ui.err['su.pw'])}</div>`:''}</div>
        ${fld('su.pw2',{label:'Confirm password',type:'password',ph:'Password again',auto:'new-password'})}
        <div class="field ${ui.err['su.agree']?'has-err':''}">${chk('su.agree',"I agree to Africa University's data and privacy policy")}${ui.err['su.agree']?`<div class="errmsg">${esc(ui.err['su.agree'])}</div>`:''}</div>
        <button class="btn pri" style="width:100%" type="submit">Create student account</button>
      </form>`;
    const supervisorForm=`
      <p class="muted" style="text-align:center;margin:2px 0 16px">Register as an employer or attachment supervisor to post slots and track interns.</p>
      <form data-submit="signup" novalidate>
        ${fld('su.name',{label:'Full name',ph:'Eng. Tafadzwa Moyo',auto:'name'})}
        ${fld('su.company',{label:'Company / Organization',ph:'Econet Wireless Zimbabwe',hint:'The organization where you supervise or offer attachment slots.'})}
        ${fld('su.email',{label:'Work email address',type:'email',ph:'tafadzwa.moyo@econet.co.zw',hint:"We'll send a verification code to confirm your email.",auto:'email'})}
        ${fld('su.phone',{label:'Work phone number',type:'tel',ph:'+263 77 123 4567',auto:'tel'})}
        <div class="field ${ui.err['su.pw']?'has-err':''}"><label for="f_su_pw">Create password</label><div class="pw"><input id="f_su_pw" type="password" data-k="su.pw" data-live="pw" value="${esc(fv('su.pw'))}" autocomplete="new-password"><button type="button" data-a="togglePw">Show</button></div><div class="strength" aria-hidden="true"><i id="pwbar"></i></div><div class="hint">At least 8 characters, one number, one symbol.</div>${ui.err['su.pw']?`<div class="errmsg">${esc(ui.err['su.pw'])}</div>`:''}</div>
        ${fld('su.pw2',{label:'Confirm password',type:'password',ph:'Password again',auto:'new-password'})}
        <div class="field ${ui.err['su.agree']?'has-err':''}">${chk('su.agree',"I confirm I am an industrial supervisor or partner employer collaborating with Africa University")}${ui.err['su.agree']?`<div class="errmsg">${esc(ui.err['su.agree'])}</div>`:''}</div>
        <button class="btn pri" style="width:100%" type="submit">Register as Industrial Supervisor</button>
      </form>`;
    inner=`<h1>Create your account</h1>
      <div class="seg mb" role="group" aria-label="Account type" style="margin-top:8px">
        <button type="button" data-a="setSuRole" data-v="student" aria-pressed="${role==='student'}">Student</button>
        <button type="button" data-a="setSuRole" data-v="supervisor" aria-pressed="${role==='supervisor'}">Industrial Supervisor</button>
      </div>
      ${role==='supervisor'?supervisorForm:studentForm}
      <p style="text-align:center;margin-top:16px" class="muted">Already registered? <a href="#/login"><b>Sign in</b></a></p>`;
  } else if(su.stage==='email'||su.stage==='phone'){
    const em=su.stage==='email';
    inner=`<h1>${em?'Check your email':'Now check your phone'}</h1>
      <p class="muted" style="text-align:center;margin:6px 0 18px">We sent a 6-digit verification code to <b>${esc(em?su.d.email:su.d.phone)}</b>.</p>
      <form data-submit="code" novalidate>
        ${fld('su.code',{label:'Verification code',ph:'123456',max:6,auto:'one-time-code'})}
        <p class="hint mb">Enter the 6-digit code to verify your ${em?'email':'phone'}.</p>
        <button class="btn pri" style="width:100%" type="submit">${em?'Verify email':'Verify phone'}</button>
      </form>
      <p class="small" style="text-align:center;margin-top:14px"><span class="muted">Step ${em?1:2} of 2</span></p>`;
  } else {
    const isSup = (su.role || (su.d && su.d.role)) === 'supervisor';
    inner=`<h1>${isSup?'Supervisor Registration Submitted':"Thanks, you're nearly there"}</h1>
      <div class="banner ok" style="margin:16px 0">${isSup?'✓ Your industrial supervisor registration has been submitted. Africa University administration will review your organization details and activate your account. You will receive an automated confirmation email upon approval.':(su.match?'✓ Your details match the school records. The administrator will approve your account soon.':"▲ Some details don't match school records, so the administrator will look at your sign-up and may ask you to correct it.")}</div>
      <p class="muted mb">${isSup?'Once approved, you will be able to post attachment slots, review student applicants, and track intern progress.':"You'll be able to sign in once your account is approved."}</p>
      <a class="btn pri" style="width:100%" href="#/login">Back to sign in</a>`;
  }
  return `<div class="auth"><div class="authbox"><div style="text-align:right;margin-bottom:8px">${themeBtn()}</div><div class="authcard"><div class="logo">${logo().replace(/^<span class="logo">|<\/span>$/g,'')}</div>${inner}</div></div></div>`;
}
actions.setSuRole=el=>{F['su.role']=el.dataset.v;ui.err={};render()};
submits.signup=()=>{
  const role=fv('su.role','student');
  const email=fv('su.email').trim(),phone=fv('su.phone').trim(),pw=fv('su.pw'),pw2=fv('su.pw2');
  ui.err={};

  if(!/^\S+@\S+\.\S+$/.test(email))ui.err['su.email']='Enter a valid email address.';
  if(!/^[+\d][\d\s-]{6,}$/.test(phone))ui.err['su.phone']='Enter a valid phone number, like +263 77 123 4567.';
  if(pw.length<8||!/\d/.test(pw)||!/[^A-Za-z0-9]/.test(pw))ui.err['su.pw']='Use at least 8 characters, with one number and one symbol.';
  if(pw2!==pw)ui.err['su.pw2']="The passwords don't match.";
  if(!fv('su.agree',false))ui.err['su.agree']='Please accept the terms to continue.';

  if(role==='supervisor'){
    const name=fv('su.name').trim(),company=fv('su.company').trim();
    if(!name)ui.err['su.name']='Enter your full name.';
    if(!company)ui.err['su.company']='Enter your company or organization name.';
    if(Object.keys(ui.err).length)return fail();

    if(AU_CONFIG.USE_BACKEND){
      AuAPI.signup({ role:'supervisor', name, company, email, phone, pw, pw2, agree:true }).then(r=>{
        ui.su={stage:'email',role:'supervisor',d:{role:'supervisor',name,company,email,phone,pw}};F['su.code']='';render();
      }).catch(e=>{
        ui.err['su.email']=(e&&e.message)||'Could not register supervisor. Please try again.';fail();
      });
      return;
    }
    const ex=S.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(ex&&!['rejected','correction'].includes(ex.status))ui.err['su.email']='An account already exists for this email.';
    if(Object.keys(ui.err).length)return fail();
    ui.su={stage:'email',role:'supervisor',d:{role:'supervisor',name,company,email,phone,pw}};F['su.code']='';render();
  } else {
    const id=fv('su.id').trim();
    if(!id)ui.err['su.id']='Enter your school ID.';
    if(Object.keys(ui.err).length)return fail();

    if(AU_CONFIG.USE_BACKEND){
      AuAPI.signup({ role:'student', id, email, phone, pw, pw2, agree: true }).then(r=>{
        ui.su={stage:'email',role:'student',d:{role:'student',id,email,phone,pw}};F['su.code']='';render();
      }).catch(e=>{
        ui.err['su.id']=(e&&e.message)||'Could not register. Please try again.';fail();
      });
      return;
    }
    const ex=S.users.find(u=>u.schoolId===id);
    if(!ui.err['su.id']&&ex&&!['rejected','correction'].includes(ex.status))ui.err['su.id']='There is already an account for this school ID. Try signing in instead.';
    if(Object.keys(ui.err).length)return fail();
    ui.su={stage:'email',role:'student',d:{role:'student',id,email,phone,pw}};F['su.code']='';render();
  }
};
submits.code=()=>{
  const su=ui.su;ui.err={};
  const code=fv('su.code').trim();
  if(!code){ui.err['su.code']='Please enter the verification code.';return fail()}
  const d=su.d;

  if(AU_CONFIG.USE_BACKEND){
    AuAPI.verifyCode({ role: d.role||'student', id: d.id, name: d.name, company: d.company, email: d.email, phone: d.phone, pw: d.pw, code: code, stage: su.stage }).then(r=>{
      F['su.code']='';
      if(su.stage==='email'){ui.su={stage:'phone',role:d.role,d:su.d};render();return}
      ui.su={stage:'done',role:d.role,match:r.match};render();
    }).catch(e=>{
      ui.err['su.code']=(e&&e.message)||'Verification failed. Check the code and try again.';fail();
    });
    return;
  }
  if(code!==CODE){ui.err['su.code']=`That code isn't right. Check the message and try again. (Prototype code: ${CODE})`;return fail()}
  F['su.code']='';
  if(su.stage==='email'){ui.su={stage:'phone',role:d.role,d:su.d};render();return}

  if(d.role==='supervisor'){
    S.users=S.users.filter(u=>!(u.email.toLowerCase()===d.email.toLowerCase()&&['rejected','correction'].includes(u.status)));
    S.users.push({id:uid('u'),role:'supervisor',name:d.name,company:d.company,dept:'Workplace supervisor',email:d.email,phone:d.phone,password:d.pw,status:'pending',photo:null,signup:{match:true,role:'supervisor',company:d.company,at:Date.now()}});
    addLog(`${d.name} (${d.company} · Supervisor) registered`);save();
    if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
    ui.su={stage:'done',role:'supervisor',match:true};render();
  } else {
    const rec=S.registry.find(r=>r.schoolId===d.id),issues=[];
    if(!rec)issues.push("This school ID isn't in the school records.");
    else if(rec.email.toLowerCase()!==d.email.toLowerCase())issues.push(`Records list ${rec.email}, but they entered ${d.email}.`);
    S.users=S.users.filter(u=>!(u.schoolId===d.id&&['rejected','correction'].includes(u.status)));
    S.users.push({id:uid('u'),role:'student',name:rec?rec.name:d.email.split('@')[0],schoolId:d.id,email:d.email,phone:d.phone,password:d.pw,year:rec?rec.year:1,programme:rec?rec.programme:'',status:'pending',overall:rec&&rec.overall!=null?rec.overall:null,gpas:rec&&rec.gpas?clone(rec.gpas):[],bio:'',skills:[],linkedin:'',github:'',photo:null,signup:{match:!issues.length,issues,at:Date.now()}});
    addLog((rec?rec.name:d.id)+' signed up');save();
    if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
    ui.su={stage:'done',role:'student',match:!issues.length};render();
  }
};

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  if(e.target.dataset&&e.target.dataset.bd){closeModal();return}
  const el=e.target.closest('[data-a]');if(!el)return;
  const a=actions[el.dataset.a];if(!a)return;e.preventDefault();a(el,e);
});
function readInput(t){return t.type==='checkbox'?t.checked:t.type==='file'?(t.files&&t.files[0]?t.files[0].name:''):t.value}
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.k){F[t.dataset.k]=readInput(t);if(t.dataset.live&&live[t.dataset.live])live[t.dataset.live]()}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.k){F[t.dataset.k]=readInput(t);if(t.dataset.live&&live[t.dataset.live])live[t.dataset.live]();if(t.dataset.r)render()}});
document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('form[data-submit]');if(f){e.preventDefault();submits[f.dataset.submit](f)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.modal)closeModal()});
actions.closeModal=()=>closeModal();
actions.setF=el=>{F[el.dataset.k]=el.dataset.v;render()};
actions.rate=el=>{F[el.dataset.k]=Number(el.dataset.v);render()};
actions.print=()=>{try{window.print()}catch(e){toast("Printing isn't available here. Try opening the page in its own tab.",'bad')}};
actions.copy=el=>{const t=document.getElementById(el.dataset.t);if(!t)return;t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}toast(ok?'Copied to the clipboard.':'Select the text and copy it with Ctrl+C.')};
actions.photo=el=>{const id=el.dataset.id;const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d');const s=Math.min(img.width,img.height);x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,160,160);const u=user(id);if(u){u.photo=c.toDataURL('image/jpeg',.8);save();render();toast('Photo updated.')}};img.src=r.result};r.readAsDataURL(f)};inp.click()};
window.addEventListener('hashchange',()=>{F=Object.assign({},NEXT);NEXT={};ui={err:{}};render();window.scrollTo(0,0)});

/* ---------- letter document attachment upload handlers ---------- */
actions.triggerLetterUpload=()=>{
  const inp=document.getElementById('lt_file_input');
  if(inp)inp.click();
};
actions.rmLetterAttachment=el=>{
  const id=el.dataset.id;
  if(!F['lt.attachments'])return;
  F['lt.attachments']=F['lt.attachments'].filter(a=>a.id!==id);
  render();
};
function handleLetterFileUpload(fileList){
  const files=Array.from(fileList||[]);
  if(!files.length)return;
  F['lt.attachments']=F['lt.attachments']||[];
  const MAX_FILE_SIZE=15*1024*1024; // 15MB limit per file
  let count=0;
  files.forEach(file=>{
    if(file.size>MAX_FILE_SIZE){
      toast(`"${file.name}" exceeds 15MB limit.`,'bad');
      return;
    }
    if(F['lt.attachments'].some(a=>a.name===file.name&&a.size===file.size)){
      toast(`"${file.name}" is already attached.`,'info');
      return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      F['lt.attachments'].push({
        id:'att_'+Math.random().toString(36).slice(2,9),
        name:file.name,
        size:file.size,
        type:file.type||'application/octet-stream',
        data:reader.result
      });
      count++;
      if(count===files.length){
        toast(`📎 Attached ${files.length} document(s) directly to your request!`);
        render();
      }
    };
    reader.onerror=()=>{
      toast(`Failed to read "${file.name}"`,'bad');
    };
    reader.readAsDataURL(file);
  });
}

// Global drag-and-drop & paste event delegation for letter request textbox
document.addEventListener('dragover',e=>{
  const zone=e.target&&e.target.closest&&e.target.closest('.lt-dropzone');
  if(zone){
    e.preventDefault();
    zone.classList.add('drag-over');
  }
});
document.addEventListener('dragleave',e=>{
  const zone=e.target&&e.target.closest&&e.target.closest('.lt-dropzone');
  if(zone&&(!e.relatedTarget||!zone.contains(e.relatedTarget))){
    zone.classList.remove('drag-over');
  }
});
document.addEventListener('drop',e=>{
  const zone=e.target&&e.target.closest&&e.target.closest('.lt-dropzone');
  if(zone){
    e.preventDefault();
    zone.classList.remove('drag-over');
    if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length){
      handleLetterFileUpload(e.dataTransfer.files);
    }
  }
});
document.addEventListener('paste',e=>{
  const isNote=e.target&&(e.target.id==='f_lt_note'||(e.target.closest&&e.target.closest('.lt-dropzone')));
  if(isNote&&e.clipboardData&&e.clipboardData.files&&e.clipboardData.files.length){
    e.preventDefault();
    handleLetterFileUpload(e.clipboardData.files);
  }
});
document.addEventListener('change',e=>{
  if(e.target&&e.target.id==='lt_file_input'&&e.target.files&&e.target.files.length){
    handleLetterFileUpload(e.target.files);
    e.target.value='';
  }
});

/* ---------- render ---------- */
function render(){
  if(ui._rendering)return;
  ui._rendering=true;
  try{
    const y=window.scrollY||0;const u=me();const parts=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    document.documentElement.dataset.role=u?u.role:'student';

    // Handle Unauthenticated Public Profiles and Guest Portals
    if(parts[0]==='p'){
      publicProfilePage(parts[1]||'');
      renderModal();
      return;
    }
    if(parts[0]==='guest'){
      guestPortalPage(parts.slice(1));
      renderModal();
      return;
    }

    if(!u){if(SES){SES=null;saveSes()}
      if(parts[0]!=='signup'&&parts[0]!=='login'){location.replace('#/login');return}
      app.innerHTML=parts[0]==='signup'?signupPage():loginPage();document.title=(parts[0]==='signup'?'Create your account':'Sign in')+' · '+SCHOOL;
    }else{
      if(parts[0]!==u.role){location.replace('#/'+u.role);return}
      app.innerHTML=shell(u,pageFor(u,parts.slice(1)));document.title=SIDE_TITLE[u.role]+' · '+SCHOOL;
    }
    renderModal();
    Object.keys(live).forEach(k=>{try{live[k]()}catch(e){}});
    window.scrollTo(0,ui.focusErr?y:y);
    if(ui.focusErr){ui.focusErr=false;const f=document.querySelector('.has-err input,.has-err select,.has-err textarea');if(f&&f.focus)try{f.focus()}catch(e){}}
  }finally{
    ui._rendering=false;
  }
}

/* ======================= STUDENT ======================= */
const statusChip=s=>s==='verified'?'<span class="chip ok">✓ Verified</span>':s==='evidence'?'<span class="chip bad">▲ Evidence asked for</span>':'<span class="chip warn">● Waiting to be checked</span>';
function cmtHtml(c){const w=user(c.by);return `<div class="cmt"><b>${esc(w?FNAME(w):'Someone')}:</b> ${esc(c.text)} <span class="muted small">· ${fmtD(c.at)}</span></div>`}

function gpaChart(u){
  const g=u.gpas.map((_,i)=>semGpa(u,i)),n=g.length;
  if(n<2)return '<p class="muted">Your graph appears once you have two semesters of certified grades.</p>';
  const W=640,H=230,L=46,R=26,T=26,B=42,min=Math.min(3.0,Math.floor(Math.min(...g)*2)/2),max=4.0;
  const x=i=>L+(W-L-R)*(i/(n-1)),y=v=>T+(H-T-B)*(1-(v-min)/(max-min));
  let grid='';for(let v=min;v<=max+.001;v+=.5)grid+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${v.toFixed(1)}</text>`;
  const pts=g.map((v,i)=>[x(i),y(v)]);
  const yrs=Math.ceil(n/2);let lab='';for(let k=0;k<yrs;k++){const a=2*k,b=Math.min(2*k+1,n-1);lab+=`<text x="${(x(a)+x(b))/2}" y="${H-12}" text-anchor="middle">Year ${k+1}</text>`}
  const best=g.indexOf(Math.max(...g));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="GPA by semester: ${g.map((v,i)=>`year ${Math.floor(i/2)+1} semester ${i%2+1}, ${v.toFixed(2)}`).join('; ')}">${grid}<polyline class="ln" points="${pts.map(p=>p.join(',')).join(' ')}"/>${pts.map((p,i)=>`<circle class="dot ${i===n-1?'last':''}" cx="${p[0]}" cy="${p[1]}" r="${i===n-1?7:5}"/>`).join('')}<text class="val" x="${pts[n-1][0]}" y="${pts[n-1][1]-14}" text-anchor="middle">${g[n-1].toFixed(2)}</text>${lab}</svg><p class="hint">Each dot is one semester. ${best===n-1?'Your best so far is this one.':`Your best so far was Year ${Math.floor(best/2)+1}, Semester ${best%2+1} (${g[best].toFixed(2)}).`}</p>`;
}

function studentHome(u){
  const n=u.gpas.length,cur=n?semGpa(u,n-1):null,prev=n>1?semGpa(u,n-2):null;
  const acts=myActs(u.id),letters=S.letters.filter(l=>l.sid===u.id);
  const ready=letters.filter(l=>l.status==='ready'&&l.versions.length&&!l.versions[l.versions.length-1].seen);
  const wait=acts.filter(a=>a.status==='waiting').length,ev=acts.filter(a=>a.status==='evidence').length;
  const bits=[];if(ready.length)bits.push(ready.length===1?'a letter is ready to download':`${ready.length} letters are ready to download`);
  if(ev)bits.push(ev===1?'a teacher asked for evidence on one activity':`teachers asked for evidence on ${ev} activities`);
  if(wait)bits.push(wait===1?'one activity is waiting for a teacher to check it':`${wait} activities are waiting for a teacher to check them`);
  const readyL=letters.filter(l=>l.status==='ready'||(l.status==='changes'&&l.versions.length));
  const recent=[...readyL.slice(0,2).map(l=>{const s=user(l.staffId),last=l.versions[l.versions.length-1];return `<div class="item"><span>↓ Your letter from <b>${esc(staffLabel(s))}</b> ${l.status==='changes'?'is being updated':'is ready'}</span><span class="row"><button class="btn sm" data-a="dlLetter" data-id="${l.id}">Download</button>${l.status==='ready'?`<button class="btn sm" data-a="askChange" data-id="${l.id}">Ask for changes</button>`:''}</span></div>`}),
    ...acts.slice().sort((a,b)=>b.created-a.created).slice(0,3).map(a=>`<div class="item"><span>${a.status==='verified'?'✓':a.status==='evidence'?'▲':'●'} ${esc(a.title)} ${a.status==='verified'?'was checked by a teacher':a.status==='evidence'?'needs evidence':'is waiting to be checked'}</span>${statusChip(a.status).replace('● Waiting to be checked','● Waiting').replace('▲ Evidence asked for','▲ Evidence')}</div>`)];
  const ass=S.assess.filter(a=>a.sid===u.id).sort((a,b)=>b.at-a.at)[0],sn=S.notes.filter(x=>x.sid===u.id).sort((a,b)=>b.wk-a.wk)[0];
  return `<div class="hello">${avatar(u,72,true)}<div><h1>Hi, ${esc(first(u.name))} <span aria-hidden="true">– <span class="typer" id="typer">${esc(window.__typerText||'')}</span></span><span class="sr"> Developer, Designer and Student</span></h1><p class="muted">Year ${u.year} · ${esc(u.programme)}</p></div></div>
  ${bits.length?`<div class="banner" role="status">● ${bits.length===1?'1 thing needs':bits.length+' things need'} you: ${bits.join(', and ')}.</div>`:''}
  <section class="intro" aria-label="About me, contact, certifications and skills">
   <div class="card"><div class="row between"><h3>About me</h3><span class="row"><button class="btn sm" data-a="openPublicShare">🌐 Share Profile</button><button class="btn sm" data-a="editAbout">Edit</button></span></div>
    <p>${esc(u.bio)||'<span class="muted">Add a short bio so readers know who you are.</span>'}</p>
    ${(u.publicShare&&u.publicShare.enabled)?`<div class="mt" style="font-size:0.8rem;color:var(--ok)">✓ Public profile active (share link ready)</div>`:''}</div>
   <div class="card"><div class="row between"><h3>Contact</h3><button class="btn sm" data-a="editAbout">Edit</button></div>
    <p class="small">Email: ${esc(u.email)}<br>Phone: ${esc(u.phone)||'–'}<br>LinkedIn: ${esc(u.linkedin)||'–'}<br>GitHub: ${esc(u.github)||'–'}</p></div>
   <div class="card wide"><div class="row between"><h3>Certifications &amp; Skills</h3><button class="btn sm" data-a="editAbout">Edit</button></div>
    <h4 class="cert-sub">Skills</h4>
    <div class="tags">${(u.skills||[]).length?u.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join(''):'<span class="muted">No skills added yet.</span>'}</div>
    <h4 class="cert-sub">Certifications</h4>
    ${certsHtml(u,true)}</div>
  </section>
  <h2 class="mt">What would you like to do?</h2>
  <div class="grid g3 mt" style="margin-top:10px"><button class="btn big" data-a="goGrades">See my grades</button><button class="btn big" data-a="goAddAct">Add an activity</button><button class="btn big pri" data-a="goLetter">Ask for a letter</button></div>
  <div class="grid g3 mt">
   <div class="stat"><div class="l">Your GPA this semester</div><div class="n">${cur==null?'–':fmt2(cur)}</div><div class="d" style="color:${prev==null?'var(--muted)':cur>=prev?'var(--ok)':'var(--warn)'}">${prev==null?'Your first certified semester will show here.':`${cur>=prev?'↑ Up':'↓ Down'} from ${fmt2(prev)} last semester`}</div></div>
   <div class="stat"><div class="l">Your overall GPA</div><div class="n">${u.overall==null?'–':fmt2(u.overall)}</div><div class="d" style="color:var(--ok)">${u.overall==null?'':'✓ Official, certified by the school'}</div></div>
   <div class="stat"><div class="l">Your progress to graduation</div><div class="n">${Math.round(creditsDone(u)/120*100)}%</div><div class="bar"><i style="width:${Math.min(100,creditsDone(u)/120*100)}%"></i></div><div class="d muted">${creditsDone(u)} of 120 credits done</div></div>
  </div>
  <div class="card mt"><h3>How your GPA has changed</h3>${gpaChart(u)}<div style="margin-top:8px"><button class="btn sm" data-a="goGrades">See every semester</button></div></div>
  <div class="card mt">
    <div class="row between mb" style="align-items:center">
      <div>
        <h3 style="margin:0">Featured Opportunities &amp; Attachments</h3>
        <p class="muted small" style="margin:2px 0 0">Live matches based on your certified GPA (${u.overall != null ? fmt2(u.overall) : '–'}) and skills</p>
      </div>
      <a class="btn sm pri" href="#/student/opportunities">Browse all opportunities →</a>
    </div>
    <div class="list">
      ${getOpps().slice(0, 2).map(o => {
        const m = calcOppMatch(u, o);
        return `<div class="item">
          <div>
            <b>${esc(o.title)}</b> · <span class="muted">${esc(o.org)}</span>
            <div class="muted small">Deadline: ${esc(o.deadline)} · Min GPA: ${fmt2(o.minGpa||2.5)}</div>
          </div>
          <div class="row">
            ${m.badge}
            <a class="btn sm" href="#/student/opportunities">View Details</a>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
  <div class="card mt"><h3>Recent updates</h3>${recent.length?`<div class="list">${recent.join('')}</div>`:'<div class="empty">Nothing yet. Add an activity or a project to get started.</div>'}</div>
  ${F['chg.id']?changePanel():''}
  ${ass||sn?`<div class="card mt"><h3>Feedback and notes</h3><div class="list">${ass?`<div><b>${esc(FNAME(user(ass.by)))}</b> <span class="muted small">· ${fmtD(ass.at)}</span><div class="muted small">Leadership ${ass.r.leadership||'–'} · Teamwork ${ass.r.teamwork||'–'} · Communication ${ass.r.communication||'–'} (out of 5)</div>${ass.feedback?`<p>${esc(ass.feedback)}</p>`:''}</div>`:''}${sn?`<div><b>${esc(user(sn.by).name)}</b> <span class="muted small">· workplace supervisor, week ${sn.wk}</span><p>${esc(sn.text)}</p></div>`:''}</div></div>`:''}`;
}
actions.goGrades=()=>go('/student/grades');
actions.goAddAct=()=>go('/student/activities',{'act.add':true});
actions.goLetter=()=>go('/student/letters');
function changePanel(){
  const l=S.letters.find(x=>x.id===F['chg.id']);if(!l)return '';const s=user(l.staffId),err=ui.err['chg.text'];
  return `<div class="card mt" id="chgpanel"><h3>What would you like changed?</h3><p class="muted small mb">${esc(staffLabel(s))} will see your message and update the letter. Be as specific as you can.</p>
  <div class="field ${err?'has-err':''}"><textarea data-k="chg.text" data-live="chgcount" rows="3" maxlength="600" aria-label="What would you like changed" placeholder="For example: please mention my final-year project and how I led the team.">${esc(fv('chg.text'))}</textarea>${err?`<div class="errmsg">${esc(err)}</div>`:''}<div class="hint" style="text-align:right"><span id="live-chgcount">${fv('chg.text').length}</span> / 600</div></div>
  <div class="row"><button class="btn pri" data-a="sendChange">Send request</button><button class="btn" data-a="cancelChange">Cancel</button></div>
  <p class="hint mt">You can still download the current version while you wait. You can ask for changes up to 2 times per letter (${l.changesUsed} used).</p></div>`}
live.chgcount=()=>{const el=document.getElementById('live-chgcount');if(el)el.textContent=fv('chg.text').length};
actions.askChange=el=>{const l=S.letters.find(x=>x.id===el.dataset.id);if(l.changesUsed>=2){toast("You've used both change requests for this letter. Please contact the staff member directly.",'bad');return}F['chg.id']=l.id;F['chg.text']='';ui.err={};render();setTimeout(()=>{const p=document.getElementById('chgpanel');if(p&&p.scrollIntoView)p.scrollIntoView({behavior:'smooth',block:'center'})},30)};
actions.cancelChange=()=>{delete F['chg.id'];delete F['chg.text'];ui.err={};render()};
actions.sendChange=()=>{const l=S.letters.find(x=>x.id===F['chg.id']),t=fv('chg.text').trim();if(!t){ui.err['chg.text']='Write what you would like changed before sending.';return fail()}
  l.status='changes';l.changesUsed++;l.changeRequests.push({text:t,at:Date.now()});l.draft='';save();delete F['chg.id'];delete F['chg.text'];ui.err={};render();toast('Request sent. You can still download the current version while you wait.')};
actions.dlLetter=el=>{
  const l=S.letters.find(x=>x.id===el.dataset.id);
  if(!l||!l.versions||!l.versions.length){toast('No completed version of this letter is available yet.','bad');return}
  const v=l.versions[l.versions.length-1];
  v.seen=true;save();render();
  openModal('Your letter',()=>letterDocHtml(l,v),{wide:true});
};

actions.exportLetterDoc=el=>{
  const l=S.letters.find(x=>x.id===(el.dataset.id||F['dl.letterId']));
  if(!l||!l.versions||!l.versions.length)return;
  const v=l.versions[l.versions.length-1];
  const st=user(l.sid)||me()||{name:'Student',schoolId:l.sid||'',programme:'Africa University'};
  const recommender=(v&&v.signedBy)||(l.staffId&&user(l.staffId)&&user(l.staffId).name)||l.recipientName||'Official Recommender';

  const content=`AFRICA UNIVERSITY
OFFICIAL LETTER OF RECOMMENDATION
Mutare, Zimbabwe

Date: ${new Date(v.sent||Date.now()).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
Candidate: ${st.name} (${st.schoolId||''})
Programme: ${st.programme||'Africa University'}
Purpose: ${l.purpose||'Academic / Professional Application'}
Certified Recommender: ${recommender}
Verification Reference ID: ${l.id}

================================================================================

${v.body}

================================================================================
Certified and Issued via Africa University Student Portfolio & Recommendation System
Secure Document Verification Reference: ${l.id}
`;

  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`Recommendation_Letter_${st.name.replace(/\s+/g,'_')}_${l.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Letter document downloaded successfully.');
};

actions.printLetterDoc=el=>{
  const l=S.letters.find(x=>x.id===(el.dataset.id||F['dl.letterId']));
  if(!l||!l.versions||!l.versions.length)return;
  const v=l.versions[l.versions.length-1];
  const st=user(l.sid)||me()||{name:'Student',schoolId:l.sid||'',programme:'Africa University'};
  const sf=(l.staffId&&user(l.staffId))||{
    name:(v&&v.signedBy)||l.recipientName||'Official Recommender',
    dept:'Africa University Faculty'
  };

  const printWin=window.open('','_blank');
  if(printWin){
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recommendation Letter - ${esc(st.name)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; padding: 48px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; }
    .header { border-bottom: 2px solid #c49a45; padding-bottom: 12px; margin-bottom: 24px; }
    .uni { font-size: 24px; font-weight: bold; color: #0b1f3a; margin: 0; }
    .dept { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .meta { font-size: 13px; color: #475569; margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .body { font-size: 15px; white-space: pre-wrap; margin: 28px 0; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 48px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="uni">Africa University</div>
    <div class="dept">${esc(sf.dept||'Office of Academic Affairs')}</div>
  </div>
  <div class="meta">
    <strong>Candidate:</strong> ${esc(st.name)} (${esc(st.schoolId||'')}) &bull; 
    <strong>Programme:</strong> ${esc(st.programme||'Africa University')} &bull; 
    <strong>Purpose:</strong> ${esc(l.purpose||'Official Reference')} &bull; 
    <strong>Date:</strong> ${fmtDL(v.sent||Date.now())}
  </div>
  <div class="body">${esc(v.body)}</div>
  <div class="footer">
    Africa University, Mutare, Zimbabwe &bull; Verified Credentials &amp; Portfolio System &bull; Reference ID: ${esc(l.id)}
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`);
    printWin.document.close();
  } else {
    window.print();
  }
};

function letterDocHtml(l,v){
  if(!v&&l&&l.versions&&l.versions.length){v=l.versions[l.versions.length-1]}
  if(!v)return '<div class="empty">No letter content available.</div>';
  F['dl.letterId']=l.id;
  const st=user(l.sid)||me()||{name:'Student',schoolId:l.sid||'',programme:'Africa University'};
  const sf=(l.staffId&&user(l.staffId))||{
    name:(v&&v.signedBy)||l.recipientName||'Official Recommender',
    dept:'Africa University Faculty'
  };

  return `<div class="doc">
    <div class="dm">${esc(SCHOOL)} · ${esc(sf.dept||'Faculty of Academic Affairs')}</div>
    <h2>Official Letter of Recommendation</h2>
    <div class="dm">For <b>${esc(st.name)}</b> (${esc(st.schoolId||'')}) · ${esc(l.purpose)} · Signed by <b>${esc((v&&v.signedBy)||sf.name)}</b> on ${fmtDL(v.sent)}</div>
    <div style="white-space: pre-wrap; line-height: 1.7; font-size: 1.05rem; margin-top: 18px; color: #1e293b;">${esc(v.body)}</div>
  </div>
  <div class="row noprint mt" style="gap: 10px; margin-top: 24px; flex-wrap: wrap;">
    <button class="btn pri" data-a="printLetterDoc" data-id="${l.id}">🖨️ Print or Save as PDF</button>
    <button class="btn" data-a="exportLetterDoc" data-id="${l.id}">📥 Download Document (.txt)</button>
    <button class="btn" data-a="closeModal">Close</button>
  </div>
  <p class="hint noprint mt">Use "Print or Save as PDF" to generate an official certified Africa University letterhead document.</p>`;
}

/* grades & official/unofficial AU transcript */
function fmtTrStamp(ts){
  const d=new Date(ts||Date.now());
  const pad=n=>String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function buildAuTranscriptHtml(u,kind){
  const tr=getStudentTranscript(u)||{};
  const n=semCount(u);
  const nameFormatted=esc(formatTranscriptName(u.name)).replace(/\n/g,'<br>');
  const dob=tr.dob||'-';
  const sex=tr.sex||'-';
  const nat=tr.nationality||'-';
  const spec=tr.specialisation||'-';
  const adm=tr.admissionYear||('AUG'+String(26-(Number(u.year)||1)).padStart(2,'0'));
  const comp=tr.completionYear||'-';
  const prog=fullProgramName(u.programme);
  const refNo=tr.refNo||(`TRN-2026-${String(u.schoolId||'000589').replace(/\D/g,'').slice(-6).padStart(6,'0')}`);
  const verifyUrl=`${window.location.origin}${window.location.pathname}#/p/${encodeURIComponent(u.shareSlug||u.schoolId||u.id)}`;
  const qrSrc=`https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=2&data=${encodeURIComponent(verifyUrl)}`;
  const titleText=kind==='official'?'Official Transcript':'Unofficial Transcript';

  let semsHtml='';
  if(!n){
    semsHtml=`<div style="padding:24px 0;text-align:center;color:#555">No certified semester results have been uploaded by the Registry Office yet.</div>`;
  } else {
    for(let i=0;i<n;i++){
      const semLabel=(tr.semesters&&tr.semesters[i]&&tr.semesters[i].label)||(`Sem-${i+1}`);
      const cList=courses(u,i);
      const st=semStats(u,i);
      const cu=cumStats(u,i);
      semsHtml+=`
      <div class="au-tr-sem" style="margin-top:${i===0?'14px':'22px'}">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:13px">
          <strong style="font-weight:700">${esc(semLabel)}</strong>
          <span>${esc(semLabel)}</span>
        </div>
        <table class="au-tr-table" style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead>
            <tr style="border-bottom:2px solid #000">
              <th style="text-align:left;padding:5px 8px 5px 4px;width:17%;font-weight:700">COURSE CODE</th>
              <th style="text-align:left;padding:5px 8px;width:45%;font-weight:700">COURSE TITLE</th>
              <th style="text-align:right;padding:5px 10px;width:13%;font-weight:700">Credit Hours</th>
              <th style="text-align:right;padding:5px 10px;width:11%;font-weight:700">Weight</th>
              <th style="text-align:center;padding:5px 4px;width:14%;font-weight:700">Grade Awarded</th>
            </tr>
          </thead>
          <tbody>
            ${cList.map(c=>`
            <tr>
              <td style="padding:5px 8px 5px 4px">${esc(c.code)}</td>
              <td style="padding:5px 8px">${esc(c.name)}</td>
              <td style="padding:5px 10px;text-align:right">${fmt2(c.credits)}</td>
              <td style="padding:5px 10px;text-align:right">${fmt2(c.weight!=null?c.weight:c.points)}</td>
              <td style="padding:5px 4px;text-align:center">${esc(c.grade)}</td>
            </tr>`).join('')}
            <tr><td colspan="5" style="height:8px"></td></tr>
            <tr>
              <td colspan="2" style="padding:4px 8px 4px 4px;font-weight:700">GRADE POINT AVERAGE</td>
              <td style="padding:4px 10px;text-align:right">${fmt2(st.credits)}</td>
              <td style="padding:4px 10px;text-align:right">${fmt2(st.weighted)}</td>
              <td style="padding:4px 4px;text-align:right;font-weight:700">${fmt2(st.gpa)}</td>
            </tr>
            <tr style="border-bottom:1.5px solid #000">
              <td colspan="2" style="padding:4px 8px 8px 4px;font-weight:700">CUMULATIVE GRADE POINT AVERAGE</td>
              <td style="padding:4px 10px 8px;text-align:right">${fmt2(cu.credits)}</td>
              <td style="padding:4px 10px 8px;text-align:right">${fmt2(cu.weighted)}</td>
              <td style="padding:4px 4px 8px;text-align:right;font-weight:700">${fmt2(cu.cgpa)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    }
  }

  return `
  <div class="au-transcript-paper" id="au-transcript-paper" style="background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;padding:32px 36px;max-width:820px;margin:0 auto;border:1px solid #d1d5db;border-radius:4px;line-height:1.4">
    <div style="text-align:center;margin-bottom:14px">
      <img src="${LOGO_SRC}" alt="Africa University" style="height:62px;width:auto;object-fit:contain;margin:0 auto 6px;display:block">
      <div style="font-style:italic;color:#6b7280;font-size:11.5px">A United Methodist-Related Institution</div>
    </div>
    <div style="border-top:2px solid #000;border-bottom:1.5px solid #000;padding:12px 2px;font-size:12px">
      <table style="width:100%;border-collapse:collapse;border:none">
        <tbody>
          <tr>
            <td style="width:24%;padding:4px 4px 4px 0;font-weight:700;vertical-align:top;border:none">NAME:</td>
            <td style="width:26%;padding:4px 8px 4px 0;vertical-align:top;border:none">${nameFormatted}</td>
            <td style="width:22%;padding:4px 4px;font-weight:700;vertical-align:top;border:none">SEX:</td>
            <td style="width:28%;padding:4px 0;vertical-align:top;border:none">${esc(sex)}</td>
          </tr>
          <tr>
            <td style="padding:4px 4px 4px 0;font-weight:700;vertical-align:top;border:none">DATE OF BIRTH:</td>
            <td style="padding:4px 8px 4px 0;vertical-align:top;border:none">${esc(dob)}</td>
            <td style="padding:4px 4px;font-weight:700;vertical-align:top;border:none">NATIONALITY:</td>
            <td style="padding:4px 0;vertical-align:top;border:none">${esc(nat)}</td>
          </tr>
          <tr>
            <td style="padding:4px 4px 4px 0;font-weight:700;vertical-align:top;border:none">REGISTRATION NUMBER:</td>
            <td style="padding:4px 8px 4px 0;vertical-align:top;border:none">${esc(u.schoolId||'-')}</td>
            <td style="padding:4px 4px;font-weight:700;vertical-align:top;border:none">PROGRAM:</td>
            <td style="padding:4px 0;vertical-align:top;border:none">${esc(prog)}</td>
          </tr>
          <tr>
            <td style="padding:4px 4px 4px 0;font-weight:700;vertical-align:top;border:none">AREA OF<br>SPECIALISATION:</td>
            <td style="padding:4px 8px 4px 0;vertical-align:middle;border:none">${esc(spec)}</td>
            <td style="padding:4px 4px;border:none"></td>
            <td style="padding:4px 0;border:none"></td>
          </tr>
          <tr>
            <td style="padding:4px 4px 4px 0;font-weight:700;vertical-align:top;border:none">YEAR OF ADMISSION:</td>
            <td style="padding:4px 8px 4px 0;vertical-align:top;border:none">${esc(adm)}</td>
            <td style="padding:4px 4px;font-weight:700;vertical-align:top;border:none">YEAR OF COMPLETION:</td>
            <td style="padding:4px 0;vertical-align:top;border:none">${esc(comp)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="text-align:center;font-weight:700;font-size:15px;padding:8px 0;border-bottom:1.5px solid #000">
      ${esc(titleText)}
    </div>
    ${semsHtml}
    <div style="border-top:1px solid #374151;margin-top:26px;padding-top:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
      <div style="font-size:10.5px;color:#4b5563;line-height:1.5">
        <div>${esc(fmtTrStamp())}</div>
        <div>Page 1 of 1</div>
      </div>
      <div style="border:1px solid #000;padding:8px 10px;text-align:center;background:#fff;min-width:136px">
        <img src="${qrSrc}" alt="Scan to Verify Transcript" style="width:116px;height:116px;display:block;margin:0 auto 4px">
        <div style="font-size:9.5px;color:#111">Scan to Verify</div>
        <div style="font-size:10px;font-weight:700;color:#000">${esc(refNo)}</div>
      </div>
    </div>
  </div>`;
}

function gradesPage(u){
  const n=semCount(u),defSem=n?n-1:0;
  const i=Math.min(Math.max(0,Number(fv('gr.sem',defSem))),Math.max(0,n-1));
  const tr=getStudentTranscript(u)||{};
  const cuAll=cumStats(u);
  const overallVal=u.overall!=null?u.overall:(n?cuAll.cgpa:null);
  let body;
  if(!n){
    body=`<div class="empty">No semester courses or grades have been certified yet. Grades and courses appear here once the Registry Office uploads them.</div>`;
  } else {
    const semLabel=(tr.semesters&&tr.semesters[i]&&tr.semesters[i].label)||(`Sem-${i+1}`);
    const c=courses(u,i),st=semStats(u,i),cu=cumStats(u,i);
    body=`<div class="card">
      <div class="row between">
        <div>
          <div class="muted">${esc(semLabel)} (Year ${Math.ceil((i+1)/2)}, Semester ${(i%2)+1})</div>
          <div style="font-size:2.1rem;font-weight:700;line-height:1.2">${fmt2(st.gpa)} <span class="muted small" style="font-weight:400;font-size:.95rem">Semester GPA · CGPA ${fmt2(cu.cgpa)}</span></div>
          <div style="color:var(--ok)">✓ Certified by Africa University Registry</div>
        </div>
        <div style="text-align:right">
          <div><b>${fmt2(st.credits)}</b> Credit Hours</div>
          <div class="muted small">Weighted Points: <b>${fmt2(st.weighted)}</b></div>
        </div>
      </div>
      <div class="tw mt">
        <table>
          <thead>
            <tr>
              <th>COURSE CODE</th>
              <th>COURSE TITLE</th>
              <th class="c">Credit Hours</th>
              <th class="c">Weight</th>
              <th class="c">Grade Awarded</th>
            </tr>
          </thead>
          <tbody>
            ${c.map(x=>`<tr>
              <td><b>${esc(x.code)}</b></td>
              <td>${esc(x.name)}</td>
              <td class="c">${fmt2(x.credits)}</td>
              <td class="c">${fmt2(x.weight!=null?x.weight:x.points)}</td>
              <td class="c"><b>${esc(x.grade)}</b></td>
            </tr>`).join('')}
            <tr style="border-top:2px solid var(--line);font-weight:700">
              <td colspan="2">GRADE POINT AVERAGE</td>
              <td class="c">${fmt2(st.credits)}</td>
              <td class="c">${fmt2(st.weighted)}</td>
              <td class="c">${fmt2(st.gpa)}</td>
            </tr>
            <tr style="font-weight:700">
              <td colspan="2">CUMULATIVE GRADE POINT AVERAGE</td>
              <td class="c">${fmt2(cu.credits)}</td>
              <td class="c">${fmt2(cu.weighted)}</td>
              <td class="c">${fmt2(cu.cgpa)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }
  const semTabs=Array.from({length:Math.max(1,n)},(_,idx)=>{
    const lbl=(tr.semesters&&tr.semesters[idx]&&tr.semesters[idx].label)||(`Sem-${idx+1}`);
    return [idx,`${lbl} (Y${Math.ceil((idx+1)/2)}S${(idx%2)+1})`];
  });
  return `${crumbs([['Home','/student'],['My grades']])}
  <div class="pagehead">
    <div><h1>My grades &amp; transcript</h1><p class="sub">Official semester courses, credit hours, weights, GPA and Cumulative GPA (CGPA).</p></div>
    <div class="row">
      <button class="btn" data-a="transcript" data-kind="unofficial">📄 Unofficial Transcript</button>
      <button class="btn pri" data-a="transcript" data-kind="official">🖨️ Download Official Transcript</button>
    </div>
  </div>
  <div class="grid g3">
    <div class="stat"><div class="l">Cumulative GPA (CGPA)</div><div class="n">${overallVal==null?'–':fmt2(overallVal)}</div><div class="d" style="color:var(--ok)">✓ Certified by the Registrar</div></div>
    <div class="stat"><div class="l">Cumulative Credit Hours</div><div class="n">${fmt2(cuAll.credits)}</div><div class="d muted">${n} completed ${n===1?'semester':'semesters'}</div></div>
    <div class="stat"><div class="l">Total Weighted Points</div><div class="n">${fmt2(cuAll.weighted)}</div><div class="d muted">Quality points earned</div></div>
  </div>
  ${n?`<div class="mt"><div class="muted small" style="margin-bottom:6px">Select semester</div>${tabs('gr.sem',semTabs,defSem)}</div>`:''}
  ${body}
  <p class="hint mt">Courses and grades are uploaded by the Registry Office and are read-only for students. Think a course or grade is wrong? <a href="mailto:registry@africau.edu">Contact the Registry Office</a>.</p>`;
}

actions.transcript=el=>{
  const targetUser=(el&&el.dataset&&el.dataset.id)?user(el.dataset.id):me();
  if(!targetUser)return;
  F['tr.uid']=targetUser.id;
  F['tr.kind']=(el&&el.dataset&&el.dataset.kind)||F['tr.kind']||'unofficial';
  const openTrModal=()=>{
    const kind=fv('tr.kind','unofficial');
    openModal(`${kind==='official'?'Official':'Unofficial'} Academic Transcript — ${targetUser.name}`,()=>`
      <div class="row between mb noprint" style="background:var(--tint);padding:10px 14px;border-radius:8px;border:1px solid var(--line)">
        <div class="row" style="gap:6px">
          <span class="small muted">Transcript Format:</span>
          <button type="button" class="btn sm ${kind==='unofficial'?'pri':''}" data-a="toggleTranscriptKind" data-kind="unofficial">Unofficial Transcript</button>
          <button type="button" class="btn sm ${kind==='official'?'pri':''}" data-a="toggleTranscriptKind" data-kind="official">Official Transcript</button>
        </div>
        <div class="row" style="gap:8px">
          <button type="button" class="btn sm pri" data-a="printTranscript">🖨️ Download / Save as PDF</button>
          <button type="button" class="btn sm" data-a="closeModal">Close</button>
        </div>
      </div>
      ${buildAuTranscriptHtml(targetUser,kind)}
      <div class="row noprint mt" style="justify-content:flex-end">
        <button type="button" class="btn pri" data-a="printTranscript">🖨️ Download / Save as PDF</button>
        <button type="button" class="btn" data-a="closeModal">Close</button>
      </div>
    `,{wide:true});
  };
  openTrModal();
};
actions.toggleTranscriptKind=el=>{
  F['tr.kind']=el.dataset.kind||'unofficial';
  const targetUser=user(F['tr.uid'])||me();
  if(targetUser)actions.transcript({dataset:{id:targetUser.id,kind:F['tr.kind']}});
};
actions.printTranscript=()=>{
  const targetUser=user(F['tr.uid'])||me();
  if(!targetUser)return;
  const kind=fv('tr.kind','unofficial');
  const htmlContent=buildAuTranscriptHtml(targetUser,kind);
  const printWin=window.open('','_blank','width=900,height=980');
  if(printWin){
    const absLogo=new URL(LOGO_SRC,window.location.href).href;
    const printHtml=htmlContent.replace(`src="${LOGO_SRC}"`,`src="${absLogo}"`);
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(targetUser.name)} - ${kind==='official'?'Official':'Unofficial'} Transcript (${esc(targetUser.schoolId||'')})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
    #au-transcript-paper { border: none !important; padding: 8px 4px !important; max-width: 100% !important; }
  </style>
</head>
<body>
  ${printHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`);
    printWin.document.close();
  } else {
    window.print();
  }
};

/* projects */
function projectsPage(u){
  const ps=myProjects(u.id),n=ps.length;
  const full=p=>`<div class="card"><div class="row between"><div><h3 style="margin:0">${esc(p.name)}</h3><div class="muted small">${esc(p.kind)}</div></div><button class="btn sm" data-a="editProj" data-id="${p.id}">Edit</button></div>
   <div class="grid g2 mt" style="margin-top:12px"><div><b>Goal</b><p>${esc(p.goal)||'<span class="muted">Not added yet.</span>'}</p></div><div><b>Challenge and what I did</b><p>${esc(p.challenge)||'<span class="muted">Not added yet.</span>'}</p></div><div><b>My role</b><p>${esc(p.role)||'<span class="muted">Not added yet.</span>'}</p></div><div><b>Result</b><p>${esc(p.result)||'<span class="muted">Not added yet.</span>'}</p></div></div>
   ${projLinks(p)}</div>`;
  const open=fv('pr.open','');
  return `${crumbs([['Home','/student'],['My projects']])}<div class="pagehead"><div><h1>My projects</h1><p class="sub">Show your best work. Three to six strong projects work better than lots of small ones. Your supervisor and lecturers can see this page.</p></div><button class="btn pri" data-a="newProj">+ Add a project</button></div>
  <div class="row mb"><span class="chip ${n>=3&&n<=6?'ok':'warn'}">${n} of 6 projects ${n>=3&&n<=6?'✓ A good number':n<3?'· Aim for at least 3':''}</span></div>
  ${n?`<div class="tabs" role="group" aria-label="Filter projects">${PCATS.map(([v,l])=>`<button type="button" data-a="projFilter" data-v="${v}" aria-pressed="${fv('pr.cat','all')===v}">${l}</button>`).join('')}</div><div class="stack">${ps.map((p,i)=>`<div class="pfilter" data-category="${projCat(p)}">${i<2||open===p.id?full(p):`<div class="card"><div class="item"><div><b>${i+1+1-1}. ${esc(p.name)}</b><div class="muted small">${esc(p.kind)}</div></div><span class="row"><button class="btn sm" data-a="openProj" data-id="${p.id}">Open</button><button class="btn sm" data-a="editProj" data-id="${p.id}">Edit</button></span></div></div>`}</div>`).join('')}</div><div class="empty" id="pfEmpty" hidden>No projects in this group yet.</div>`:'<div class="empty">No projects yet. Add your first one to show what you can do.</div>'}`}
function projLinks(p){const lv=link(p.live),cd=link(p.code);if(!lv&&!cd)return '';return `<div class="row mt">${lv?`<a class="btn sm" href="${esc(lv)}" target="_blank" rel="noopener">Open live version</a>`:''}${cd?`<a class="btn sm" href="${esc(cd)}" target="_blank" rel="noopener">View code</a>`:''}</div>`}
actions.openProj=el=>{F['pr.open']=el.dataset.id;render()};
actions.newProj=()=>{if(!need('add_projects'))return;if(myProjects(me().id).length>=6){toast('You have 6 projects, which is the most we show. Remove one to add another.','bad');return}go('/student/projects/new')};
actions.editProj=el=>go('/student/projects/edit/'+el.dataset.id);
/* ---------- certifications and skills ---------- */
const CERT_MAX=6,CERT_TYPES=['image/jpeg','image/png'];
const CERT_ICON='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><circle cx="12" cy="10" r="2.6"/><path d="M9.5 17l-1 4 3.5-2 3.5 2-1-4"/></svg>';
function certsHtml(u,mine){const c=u.certs||[];
  if(!c.length)return `<p class="muted small">${mine?'No certifications yet. Choose Edit to add a certificate image, who issued it and a link to verify it.':'No certifications added.'}</p>`;
  return `<ul class="certs">${c.map(x=>{const lk=link(x.url);
    const thumb=x.img?`<button type="button" class="cert-thumb" data-a="viewCert" data-id="${esc(x.id)}" data-sid="${esc(u.id)}" aria-label="View certificate: ${esc(x.name)}"><img src="${x.img}" alt="Certificate image for ${esc(x.name)}"></button>`:`<div class="cert-thumb ph" aria-hidden="true">${CERT_ICON}</div>`;
    return `<li class="cert">${thumb}<div class="cert-body"><b>${esc(x.name)}</b><div class="muted small">${x.issuer?'Issued by '+esc(x.issuer):'Issuer not added'}</div>${lk?`<a class="btn sm" href="${esc(lk)}" target="_blank" rel="noopener noreferrer">Verify credential ↗</a>`:''}</div></li>`}).join('')}</ul>`}
actions.viewCert=el=>{const s=user(el.dataset.sid),c=s&&(s.certs||[]).find(x=>x.id===el.dataset.id);if(!c)return;const lk=link(c.url);
  openModal(c.name,()=>`<img class="cert-full" src="${c.img}" alt="Certificate image for ${esc(c.name)}"><p class="mt">${c.issuer?'Issued by <b>'+esc(c.issuer)+'</b>':'<span class="muted">Issuer not added</span>'}</p><div class="row">${lk?`<a class="btn sm pri" href="${esc(lk)}" target="_blank" rel="noopener noreferrer">Verify credential ↗</a>`:''}<button class="btn sm" data-a="closeModal">Close</button></div>`,{wide:true})};
function certEditHtml(){const d=F['ab.certs']||[];
  if(!d.length)return '<p class="muted small">No certifications yet.</p>';
  return d.map((c,i)=>{const err=ui.err['ab.c'+i],id='cert'+i;
   return `<div class="certedit ${err?'has-err':''}"><div class="certedit-top"><div class="cert-thumb ${c.img?'':'ph'}">${c.img?`<img src="${c.img}" alt="Preview of the certificate image">`:CERT_ICON}</div>
    <div class="grow"><label for="${id}_img">Certificate image (JPEG or PNG)</label><input id="${id}_img" type="file" accept="image/jpeg,image/png" data-cimg="${i}">${c.img?`<button type="button" class="linkbtn small" data-a="rmCertImg" data-i="${i}">Remove image</button>`:''}</div></div>
    <div class="field"><label for="${id}_n">Certification name</label><input id="${id}_n" type="text" maxlength="80" value="${esc(c.name)}" data-ci="${i}" data-cf="name" placeholder="For example: AWS Cloud Practitioner"${err&&!(c.name||'').trim()?' aria-invalid="true"':''}></div>
    <div class="field"><label for="${id}_o">Issuing body</label><input id="${id}_o" type="text" maxlength="80" value="${esc(c.issuer)}" data-ci="${i}" data-cf="issuer" placeholder="For example: Amazon Web Services"></div>
    <div class="field"><label for="${id}_u">Credential or verification link (optional)</label><input id="${id}_u" type="url" inputmode="url" value="${esc(c.url)}" data-ci="${i}" data-cf="url" placeholder="https://"></div>
    ${err?`<div class="errmsg" role="alert">${esc(err)}</div>`:''}
    <button type="button" class="btn sm danger" data-a="rmCert" data-i="${i}">Remove this certification</button></div>`}).join('')}
function refreshCerts(){const c=document.getElementById('certlist');if(c)c.innerHTML=certEditHtml();const b=document.getElementById('addcert');if(b)b.disabled=(F['ab.certs']||[]).length>=CERT_MAX}
function certImage(file,cb){
  if(CERT_TYPES.indexOf(file.type)<0){toast('Please choose a JPEG or PNG image of the certificate.','bad');return cb(null)}
  if(file.size>10*1024*1024){toast('That image is over 10 MB. Please choose a smaller one.','bad');return cb(null)}
  const r=new FileReader(),bad=()=>{toast('That image could not be read. Try a different file.','bad');cb(null)};
  r.onerror=bad;r.onload=()=>{const img=new Image();img.onerror=bad;img.onload=()=>{const k=Math.min(1,800/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.82))};img.src=r.result};
  r.readAsDataURL(file)}
document.addEventListener('input',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.cf){const d=F['ab.certs'],i=Number(t.dataset.ci);if(d&&d[i])d[i][t.dataset.cf]=t.value}});
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||t.dataset.cimg===undefined)return;const i=Number(t.dataset.cimg),f=t.files&&t.files[0];if(!f)return;
  certImage(f,data=>{const d=F['ab.certs'];if(data&&ui.modal&&d&&d[i]){d[i].img=data;delete ui.err['ab.c'+i];refreshCerts()}else t.value=''})});
actions.addCert=()=>{const d=F['ab.certs']=F['ab.certs']||[];if(d.length>=CERT_MAX){toast('You can add up to '+CERT_MAX+' certifications. Remove one to add another.','bad');return}
  d.push({id:uid('c'),name:'',issuer:'',url:'',img:''});refreshCerts();const el=document.getElementById('cert'+(d.length-1)+'_n');if(el){el.focus();if(el.scrollIntoView)el.scrollIntoView({block:'center'})}};
actions.rmCert=el=>{const d=F['ab.certs'];if(!d)return;d.splice(Number(el.dataset.i),1);Object.keys(ui.err).forEach(k=>{if(/^ab\.c\d/.test(k))delete ui.err[k]});refreshCerts()};
actions.rmCertImg=el=>{const d=F['ab.certs'],i=Number(el.dataset.i);if(d&&d[i]){d[i].img='';refreshCerts()}};
actions.editAbout=()=>{const u=me();F['ab.bio']=u.bio;F['ab.skills']=(u.skills||[]).join(', ');F['ab.phone']=u.phone;F['ab.li']=u.linkedin;F['ab.gh']=u.github;F['ab.certs']=(u.certs||[]).map(c=>Object.assign({},c));ui.err={};
  openModal('Edit about me, skills and contact',()=>`${fld('ab.bio',{label:'Short bio',ta:true,rows:4,max:400,hint:'Two or three sentences about what you do and what you want next.'})}${fld('ab.skills',{label:'Skills',hint:'Separate with commas.'})}
   <h3 class="cert-sub">Certifications</h3><p class="hint mb">Up to ${CERT_MAX}. Add a JPEG or PNG photo of each certificate, its name, who issued it and a link where someone can check it.</p>
   <div id="certlist">${certEditHtml()}</div><div class="mb"><button type="button" class="btn sm" id="addcert" data-a="addCert" ${(F['ab.certs']||[]).length>=CERT_MAX?'disabled':''}>+ Add a certification</button></div>
   ${fld('ab.phone',{label:'Phone'})}${fld('ab.li',{label:'LinkedIn'})}${fld('ab.gh',{label:'GitHub'})}<div class="row"><button class="btn pri" data-a="saveAbout">Save</button><button class="btn" data-a="closeModal">Cancel</button></div>`,{wide:true})};
actions.saveAbout=()=>{if(!need('add_projects'))return;const u=me(),out=[];let bad=false;
  Object.keys(ui.err).forEach(k=>{if(/^ab\.c\d/.test(k))delete ui.err[k]});
  (F['ab.certs']||[]).forEach((c,i)=>{const name=(c.name||'').trim(),issuer=(c.issuer||'').trim(),url=(c.url||'').trim();
    if(!name&&!issuer&&!url&&!c.img)return;
    if(!name){ui.err['ab.c'+i]='Add the name of this certification, or remove it.';bad=true;return}
    let lk='';if(url){lk=link(url);if(!lk){ui.err['ab.c'+i]='That link does not look right. Paste the full web address, like https://example.com/verify/123.';bad=true;return}}
    out.push({id:c.id,name,issuer,url:lk,img:c.img||''})});
  if(bad){renderModal();const er=document.querySelector('#modal .errmsg');if(er&&er.scrollIntoView)er.scrollIntoView({block:'center'});return}
  const prev={bio:u.bio,skills:u.skills,phone:u.phone,linkedin:u.linkedin,github:u.github,certs:u.certs};
  u.bio=fv('ab.bio').trim();u.skills=fv('ab.skills').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);u.phone=fv('ab.phone').trim();u.linkedin=fv('ab.li').trim();u.github=fv('ab.gh').trim();u.certs=out;
  try{if(AU_CONFIG.USE_BACKEND)AuAPI.pushState(S);else localStorage.setItem(KEY,JSON.stringify(S))}catch(err){let quota=false;try{localStorage.setItem(KEY+'.t','1');localStorage.removeItem(KEY+'.t');quota=true}catch(e2){}
    if(quota){Object.assign(u,prev);toast('There is not enough browser storage for these certificate images. Remove an image or use smaller files, then save again.','bad');return}}
  closeModal();render();toast('Your profile is saved.')};
const PFIELDS=[['goal','Goal'],['challenge','Problems and how you solved them'],['role','Your role'],['result','Result with numbers'],['live','Link to the live version'],['code','Link to the code']];
live.projCheck=()=>{const el=document.getElementById('live-projCheck');if(!el)return;const done=PFIELDS.filter(([k])=>fv('pj.'+k).trim()).length;el.innerHTML=`<div class="muted mb"><b>${done} of 6</b> things filled in</div>`+PFIELDS.map(([k,l])=>`<div>${fv('pj.'+k).trim()?'<span style="color:var(--ok)">✓</span>':'<span style="color:var(--warn)">●</span>'} ${l}</div>`).join('')+(done===6?'<div class="chip ok mt">✓ A strong project</div>':'')};
function projectForm(u,id){
  const p=id?S.projects.find(x=>x.id===id&&x.sid===u.id):null;if(id&&!p)return '<div class="empty">That project was not found. <a href="#/student/projects">Back to my projects</a></div>';
  const d=p||{};
  return `${crumbs([['Home','/student'],['My projects','/student/projects'],[p?'Edit project':'Add a project']])}<h1 class="mb">${p?'Edit project':'Add a project'}</h1>
  <div class="grid g21"><div class="card"><form data-submit="saveProj" data-id="${id||''}" novalidate>
   ${fld('pj.name',{label:'Project name',def:d.name,ph:'Library catalogue search',max:80})}
   ${selF('pj.kind',['Class project','Personal build','Freelance','Attachment','Final-year project','Hackathon'].map(k=>[k,k]),{label:'What kind of project is it?',def:(d.kind||'Class project').split(' · ')[0]})}
   ${fld('pj.goal',{label:'What was the goal?',ta:true,def:d.goal,lv:'projCheck',ph:'Help students find books faster than the old card list.'})}
   ${fld('pj.challenge',{label:'What problems did you hit, and how did you fix them?',ta:true,rows:4,def:d.challenge,lv:'projCheck',hint:'Explain why you made your choices, not only what you built.'})}
   ${fld('pj.role',{label:'What was your role?',ta:true,def:d.role,lv:'projCheck',hint:'If it was a team project, say what you did.'})}
   ${fld('pj.result',{label:'What was the result?',ta:true,def:d.result,lv:'projCheck',hint:'Numbers help, for example time saved or people who used it.'})}
   ${fld('pj.live',{label:'Link to the live version',def:d.live,lv:'projCheck',ph:'https://'})}
   ${fld('pj.code',{label:'Link to the code (GitHub)',def:d.code,lv:'projCheck',ph:'https://github.com/'})}
   <div class="row"><button class="btn pri" type="submit">Save project</button><a class="btn" href="#/student/projects">Cancel</a>${p?`<button type="button" class="btn danger" data-a="delProj" data-id="${p.id}">Remove project</button>`:''}</div>
  </form></div>
  <div class="stack"><div class="card"><h3>How strong is this project?</h3><div id="live-projCheck"></div></div><div class="card tint"><h3>Tips</h3><p class="small">Pick work that matches the job you want. Explain your thinking. Show what changed because of your work. Say exactly what you did.</p></div></div></div>`}
// prefill the live checklist from saved values when editing
const _pc=live.projCheck;live.projCheck=()=>{const parts=location.hash.split('/');const id=parts[4];const p=id&&S.projects.find(x=>x.id===id);if(p)PFIELDS.forEach(([k])=>{if(F['pj.'+k]===undefined)F['pj.'+k]=p[k]||''});_pc()};
submits.saveProj=f=>{if(!need('add_projects'))return;const u=me(),id=f.dataset.id,name=fv('pj.name',id&&S.projects.find(x=>x.id===id)?.name).trim();ui.err={};
  if(!name){ui.err['pj.name']='Give your project a name.';return fail()}
  const old=id?S.projects.find(x=>x.id===id):null;const g=k=>(F['pj.'+k]!==undefined?F['pj.'+k]:(old?old[k]:'')).trim();
  const kind=fv('pj.kind',old?old.kind.split(' · ')[0]:'Class project');
  const o={sid:u.id,name,kind:kind+' · '+(old&&old.kind.split(' · ')[1]||'Solo'),goal:g('goal'),challenge:g('challenge'),role:g('role'),result:g('result'),live:g('live'),code:g('code')};
  if(old)Object.assign(old,o);else S.projects.push(Object.assign({id:uid('p'),comments:[]},o));
  save();go('/student/projects');toast('Project saved.')};
actions.delProj=el=>openModal('Remove this project?',()=>`<p class="mb">This takes it off your portfolio. Supervisors and lecturers will no longer see it.</p><div class="row"><button class="btn danger" data-a="delProjYes" data-id="${el.dataset.id}">Remove project</button><button class="btn" data-a="closeModal">Keep it</button></div>`);
actions.delProjYes=el=>{S.projects=S.projects.filter(p=>p.id!==el.dataset.id);save();closeModal();go('/student/projects');toast('Project removed.')};

/* activities & evidence helpers */
function buildFallbackEvidenceSvgDataUrl(a,name){
  const st=(typeof user==='function'&&a&&a.sid)?user(a.sid):null;
  const studentName=(st&&st.name)||'Africa University Student';
  const schoolId=(st&&st.schoolId)||'';
  const title=(a&&a.title)||'Achievement Entry';
  const cat=(a&&(TYPE1[a.type]||a.type))||'Achievement';
  const yr=(a&&a.year)?('Year '+a.year):'';
  const role=(a&&a.where)||'';
  const dt=(a&&a.created)?fmtDL(a.created):fmtDL(Date.now());
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="540" viewBox="0 0 800 540">
    <rect width="800" height="540" fill="#f8fafc"/>
    <rect x="24" y="24" width="752" height="492" rx="12" fill="#ffffff" stroke="#c49a45" stroke-width="3"/>
    <rect x="24" y="24" width="752" height="84" rx="12" fill="#0b1f3a"/>
    <text x="56" y="64" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="bold">AFRICA UNIVERSITY · PORTFOLIO EVIDENCE RECORD</text>
    <text x="56" y="88" fill="#c49a45" font-family="Arial, sans-serif" font-size="13" font-weight="bold">SUBMITTED SUPPORTING DOCUMENTATION</text>
    <text x="56" y="152" fill="#64748b" font-family="Arial, sans-serif" font-size="13" font-weight="bold">CANDIDATE</text>
    <text x="56" y="178" fill="#0f172a" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${esc(studentName)} ${schoolId?'('+esc(schoolId)+')':''}</text>
    <text x="56" y="228" fill="#64748b" font-family="Arial, sans-serif" font-size="13" font-weight="bold">ACHIEVEMENT / ACTIVITY</text>
    <text x="56" y="256" fill="#0f172a" font-family="Arial, sans-serif" font-size="22" font-weight="bold">${esc(title)}</text>
    <text x="56" y="282" fill="#334155" font-family="Arial, sans-serif" font-size="15">${esc(cat)}${yr?' · '+esc(yr):''}${role?' · '+esc(role):''}</text>
    <rect x="56" y="316" width="688" height="96" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="80" y="352" fill="#0b1f3a" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Attached Evidence File: ${esc(name||'supporting_evidence')}</text>
    <text x="80" y="380" fill="#475569" font-family="Arial, sans-serif" font-size="13">Submitted on: ${esc(dt)} · Status: ${a&&a.status==='verified'?'Verified':'Awaiting Verification'}</text>
    <text x="56" y="468" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Africa University Student Portfolio &amp; Verified Credentials System · Mutare, Zimbabwe</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function getActEvidenceData(a){
  if(!a)return '';
  if(a.evidenceData)return a.evidenceData;
  if(a.evidenceFile&&a.evidenceFile.data)return a.evidenceFile.data;
  if(typeof a.evidence==='string'&&a.evidence.startsWith('data:'))return a.evidence;
  return '';
}
function getActEvidenceName(a){
  if(!a)return '';
  if(a.evidenceFile&&a.evidenceFile.name)return a.evidenceFile.name;
  if(typeof a.evidence==='string'&&!a.evidence.startsWith('data:'))return a.evidence;
  if(a.evidenceData)return 'certificate_evidence';
  return '';
}
function evidenceHtml(a){
  const rawData=getActEvidenceData(a);
  const name=getActEvidenceName(a);
  if(!rawData&&!name)return '';
  const displayData=rawData||buildFallbackEvidenceSvgDataUrl(a,name);
  const isImg=/^data:image\//i.test(displayData);
  const sizeKb=(a.evidenceFile&&a.evidenceFile.size)?` (${Math.round(a.evidenceFile.size/1024)} KB)`:'';
  return `<div class="att-row mt" style="background:var(--tint);border:1px solid var(--brand,#c49a45);padding:10px 12px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div class="row" style="gap:10px;min-width:0;flex:1">
      ${rawData&&isImg?`<img src="${rawData}" alt="${esc(name)}" style="width:46px;height:46px;object-fit:cover;border-radius:6px;border:1px solid var(--line);cursor:pointer" data-a="viewEvidence" data-id="${esc(a.id)}">`:`<span style="font-size:1.35rem">📎</span>`}
      <div style="min-width:0;flex:1">
        <div class="small" style="font-weight:700;overflow-wrap:anywhere">Attached Evidence: ${esc(name||'Supporting Evidence')}${esc(sizeKb)}</div>
        <div class="muted small">${rawData?'Click "View Evidence" to inspect the uploaded file':'Click "View Evidence" to inspect or update this evidence file'}</div>
      </div>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button type="button" class="btn sm pri" data-a="viewEvidence" data-id="${esc(a.id)}">👁 View Evidence</button>
      <a class="btn sm" style="text-decoration:none" href="${displayData}" download="${esc(rawData?(name||'evidence'):((name||'evidence')+'.svg'))}">⬇ Download</a>
    </div>
  </div>`;
}
actions.viewEvidence=el=>{
  const a=S.acts.find(x=>x.id===el.dataset.id)||(F['gv.act']&&F['gv.act'].id===el.dataset.id?F['gv.act']:null);
  if(!a)return;
  const rawData=getActEvidenceData(a);
  const name=getActEvidenceName(a)||'Evidence';
  const displayData=rawData||buildFallbackEvidenceSvgDataUrl(a,name);
  const isImg=/^data:image\//i.test(displayData);
  const isPdf=/^data:application\/pdf/i.test(rawData);
  openModal(`Supporting Evidence: ${a.title}`,()=>`
    <div style="text-align:center">
      ${!rawData?`<div class="banner info mb" style="text-align:left"><b>Note:</b> This entry (<b>${esc(name)}</b>) was submitted when only the file name was recorded. Below is the official evidence record sheet. You can also upload or replace the full-resolution image/PDF below.</div>`:''}
      ${isPdf?`<iframe src="${rawData}" style="width:100%;height:68vh;border:1px solid var(--line);border-radius:8px" title="${esc(name)}"></iframe>`:isImg?`<img src="${displayData}" alt="${esc(name)}" style="max-width:100%;max-height:68vh;border-radius:8px;border:1px solid var(--line);box-shadow:0 4px 16px rgba(0,0,0,.15)">`:`<div class="card tint"><p style="margin:0">📄 Attached Document: <b>${esc(name)}</b></p></div>`}
    </div>
    <div class="row between mt" style="flex-wrap:wrap;gap:8px">
      <div>
        ${S.acts.some(x=>x.id===a.id)?`<button type="button" class="btn sm" data-a="addEvidence" data-id="${esc(a.id)}">📤 ${rawData?'Replace / Update File':'Upload Full Image / PDF File'}</button>`:''}
      </div>
      <div class="row" style="gap:8px">
        <a class="btn pri" style="text-decoration:none" href="${displayData}" download="${esc(rawData?name:(name+'.svg'))}">⬇ Download Evidence</a>
        <button type="button" class="btn" data-a="closeModal">Close</button>
      </div>
    </div>
  `,{wide:true});
};

function readActEvidenceFile(file,cb){
  if(!file)return;
  if(file.size>15*1024*1024){
    toast('File is over 15 MB. Please choose a smaller certificate or photo.','bad');
    return;
  }
  const r=new FileReader();
  r.onload=()=>{
    const dataUrl=r.result;
    // Compress large photos (>450KB) so state sync and email attachments are fast and reliable
    if(/^image\/(jpeg|png|webp)$/i.test(file.type)&&file.size>450*1024){
      const img=new Image();
      img.onload=()=>{
        const maxD=1400;
        let w=img.width,h=img.height;
        if(w>maxD||h>maxD){
          if(w>h){h=Math.round(h*maxD/w);w=maxD;}
          else{w=Math.round(w*maxD/h);h=maxD;}
        }
        const c=document.createElement('canvas');
        c.width=w;c.height=h;
        const ctx=c.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        const compressed=c.toDataURL('image/jpeg',0.84);
        cb({name:file.name,size:Math.round(compressed.length*0.75),type:'image/jpeg',data:compressed});
      };
      img.onerror=()=>cb({name:file.name,size:file.size,type:file.type||'application/octet-stream',data:dataUrl});
      img.src=dataUrl;
      return;
    }
    cb({name:file.name,size:file.size,type:file.type||'application/octet-stream',data:dataUrl});
  };
  r.onerror=()=>toast('Could not read that file. Try another image or PDF.','bad');
  r.readAsDataURL(file);
}
document.addEventListener('change',e=>{
  const t=e.target;
  if(t&&t.id==='act_cert_file'&&t.files&&t.files[0]){
    readActEvidenceFile(t.files[0],fileObj=>{
      F['act.certFile']=fileObj;
      F['act.cert']=fileObj.name;
      render();
      toast(`📎 Attached evidence: ${fileObj.name}`);
    });
  }
  if(t&&t.id==='ev_upload_file'&&t.files&&t.files[0]){
    readActEvidenceFile(t.files[0],fileObj=>{
      F['ev.file']=fileObj;
      F['ev.name']=fileObj.name;
      delete ui.err['ev.name'];
      renderModal();
      toast(`📎 Ready to send: ${fileObj.name}`);
    });
  }
});

function activitiesPage(u){
  const all=myActs(u.id),ft=fv('act.ft','all'),fy=fv('act.fy','all');
  const list=all.filter(a=>(ft==='all'||a.type===ft)&&(fy==='all'||a.year===Number(fy))).sort((a,b)=>b.year-a.year||b.created-a.created);
  const cnt=t=>all.filter(a=>a.type===t).length,ver=all.filter(a=>a.status==='verified').length;
  const add=fv('act.add',false);
  return `${crumbs([['Home','/student'],['My activities']])}<div class="pagehead"><div><h1>My activities</h1><p class="sub">${all.length} ${all.length===1?'entry':'entries'} in total, ${ver} verified.</p></div><button class="btn pri" data-a="toggleAdd">+ Add an activity</button></div>
  ${add?activityForm(u):''}
  <div class="row between"><div class="tabs">${[['all',`Everything (${all.length})`],['achievement',`Achievements (${cnt('achievement')})`],['leadership',`Leadership (${cnt('leadership')})`],['extra',`Extracurricular (${cnt('extra')})`]].map(([v,l])=>`<button data-a="setF" data-k="act.ft" data-v="${v}" aria-pressed="${ft===v}">${l}</button>`).join('')}</div>
   <div style="min-width:140px">${selF('act.fy',[['all','All years'],...[1,2,3,4].map(y=>[y,'Year '+y])],{r:1})}</div></div>
  ${list.length?`<div class="stack">${list.map(a=>`<div class="card"><div class="item"><div class="row" style="flex-wrap:nowrap"><span class="chip info" aria-hidden="true" style="width:34px;height:34px;padding:0;justify-content:center;border-radius:10px">${{achievement:'T',leadership:'L',extra:'E'}[a.type]}</span><div><b>${esc(a.title)}</b><div class="muted small">${TYPES[a.type]} · Year ${a.year}${a.where?' · '+esc(a.where):''}${a.verifierEmail?` · Verifier: <b>${esc(a.verifierName||a.verifierEmail)}</b> (${esc(a.verifierEmail)})`:''}</div></div></div><div class="row">${statusChip(a.status)}</div></div>
    ${evidenceHtml(a)}
    ${a.comments.length?`<div class="stack mt" style="gap:6px">${a.comments.map(cmtHtml).join('')}</div>`:''}
    <div class="row mt">
      ${a.status!=='verified'?`<button class="btn sm pri" data-a="addEvidence" data-id="${a.id}">${getActEvidenceData(a)||a.evidence?'📎 Update Evidence':'📎 Attach Evidence'}</button>`:''}
      ${a.status!=='verified'?`<button class="btn sm" data-a="sendVerifyModal" data-id="${a.id}">📨 ${a.verifierEmail?'Resend Verification Email':'Send to Verifier Email'}</button>`:''}
      ${a.status!=='verified'?`<button class="btn sm danger" data-a="delAct" data-id="${a.id}">Remove entry</button>`:''}
    </div></div>`).join('')}</div>`:`<div class="empty">${all.length?'Nothing matches this filter. Try Everything or a different year.':'No activities yet. Add your first achievement, leadership role or club.'}</div>`}
  <div class="row mt2"><button class="btn" data-a="printRecord">Print or save my record</button></div>`}

function activityForm(u){
  const verQuery=(fv('act.vsearch')||'').trim().toLowerCase();
  const verResults=verQuery.length>=2?(S.users.filter(x=>(x.role==='staff'||x.role==='supervisor')&&x.status==='active'&&(x.name.toLowerCase().includes(verQuery)||(x.email&&x.email.toLowerCase().includes(verQuery))))):[];
  const certFile=F['act.certFile'];
  return `<div class="card mb"><h3>Add an activity</h3><form data-submit="saveAct" novalidate><div class="grid g2">
   ${selF('act.type',[['achievement','School achievement'],['leadership','Leadership role'],['extra','Extracurricular']],{label:'What kind is it?'})}
   ${selF('act.year',[1,2,3,4].filter(y=>y<=Math.max(u.year,1)).map(y=>[y,y]),{label:'Which year?',def:u.year})}</div>
   ${fld('act.title',{label:'What is it called?',ph:'Debate society captain'})}
   ${fld('act.where',{label:'Where or what role? (optional)',ph:"Students' union, 2 hours a week"})}
   <div class="field">
     <label for="act_cert_file">Attach a certificate, letter, or photo evidence (optional)</label>
     <input id="act_cert_file" type="file" accept="image/*,.pdf,.doc,.docx">
     ${certFile?`<div class="chip ok mt">📎 Attached: <b>${esc(certFile.name)}</b> (${Math.round(certFile.size/1024)} KB) <button type="button" style="border:none;background:transparent;cursor:pointer;margin-left:6px" data-a="clearActCert">✕</button></div>`:`<div class="hint">Upload a photo, PDF, or Word certificate so the verifier can inspect it.</div>`}
   </div>
   <div class="field">
     <label for="act_vsearch">Who should verify this? (Lecturer, Supervisor, or any External Email)</label>
     <input id="act_vsearch" data-k="act.vsearch" data-live="verifierSearch" value="${esc(fv('act.vsearch'))}" placeholder="⌕ Search lecturer by name or type any email (e.g. organizer@org.com)..." autocomplete="off">
     <div id="ver_results" class="mt" style="max-height:140px;overflow-y:auto">
       ${verQuery.length>=2?`<div class="list">${verResults.map(s=>`<div class="item" style="cursor:pointer;padding:6px 10px" data-a="pickVerifier" data-id="${esc(s.id)}" data-name="${esc(s.name)}" data-email="${esc(s.email)}"><div><b>${esc(s.name)}</b> <span class="muted small">${esc(s.dept||s.company||'AU')} · ${esc(s.email)}</span></div><button type="button" class="btn sm">Select</button></div>`).join('')}${/^\S+@\S+\.\S+$/.test(verQuery)?`<div class="item" style="cursor:pointer;padding:6px 10px;background:var(--tint)" data-a="pickVerifier" data-name="${esc(verQuery.split('@')[0])}" data-email="${esc(verQuery)}"><div><b>Send to External / Direct Email: ${esc(verQuery)}</b><div class="muted small">Works for anyone (even if not registered in the system). We'll email them a verification link &amp; 6-digit code.</div></div><button type="button" class="btn sm pri">Use this email</button></div>`:''}</div>`:''}
     </div>
     ${fv('act.vemail')?`<div class="chip ok mt">✓ Selected Verifier: <b>${esc(fv('act.vname')||fv('act.vemail'))}</b> (${esc(fv('act.vemail'))}) <button type="button" style="border:none;background:transparent;cursor:pointer;margin-left:6px" data-a="clearVerifier">✕</button></div>`:''}
   </div>
   <div class="row"><button class="btn pri" type="submit">Save &amp; Send for Verification</button><button type="button" class="btn" data-a="toggleAdd">Cancel</button></div>
   <p class="hint mt">If you enter an email address, the verifier receives an immediate email with a one-click verification link and your attached evidence.</p></form></div>`}
live.verifierSearch=()=>{
  const el=document.getElementById('ver_results');
  if(!el)return;
  const verQuery=(fv('act.vsearch')||'').trim().toLowerCase();
  const verResults=verQuery.length>=2?(S.users.filter(x=>(x.role==='staff'||x.role==='supervisor')&&x.status==='active'&&(x.name.toLowerCase().includes(verQuery)||(x.email&&x.email.toLowerCase().includes(verQuery))))):[];
  el.innerHTML=verQuery.length>=2?`<div class="list">${verResults.map(s=>`<div class="item" style="cursor:pointer;padding:6px 10px" data-a="pickVerifier" data-id="${esc(s.id)}" data-name="${esc(s.name)}" data-email="${esc(s.email)}"><div><b>${esc(s.name)}</b> <span class="muted small">${esc(s.dept||s.company||'AU')} · ${esc(s.email)}</span></div><button type="button" class="btn sm">Select</button></div>`).join('')}${/^\S+@\S+\.\S+$/.test(verQuery)?`<div class="item" style="cursor:pointer;padding:6px 10px;background:var(--tint)" data-a="pickVerifier" data-name="${esc(verQuery.split('@')[0])}" data-email="${esc(verQuery)}"><div><b>Send to External / Direct Email: ${esc(verQuery)}</b><div class="muted small">Works for anyone (even if not registered in the system). We'll email them a verification link &amp; 6-digit code.</div></div><button type="button" class="btn sm pri">Use this email</button></div>`:''}</div>`:'';
};
actions.pickVerifier=el=>{F['act.vid']=el.dataset.id||'';F['act.vemail']=el.dataset.email;F['act.vname']=el.dataset.name;F['act.vsearch']=el.dataset.email;render()};
actions.clearVerifier=()=>{delete F['act.vid'];delete F['act.vemail'];delete F['act.vname'];delete F['act.vsearch'];render()};
actions.clearActCert=()=>{delete F['act.certFile'];delete F['act.cert'];render()};
actions.toggleAdd=()=>{F['act.add']=!fv('act.add',false);ui.err={};render()};

function dispatchActivityVerification(act,vemail,vname){
  if(!vemail||!/^\S+@\S+\.\S+$/.test(vemail))return;
  const matchedStaff=S.users.find(x=>(x.role==='staff'||x.role==='supervisor')&&x.email&&x.email.toLowerCase()===vemail.toLowerCase());
  if(matchedStaff){
    act.verifierId=matchedStaff.id;
    act.verifierName=matchedStaff.name;
    if(matchedStaff.role==='staff'){
      matchedStaff.teaches=matchedStaff.teaches||[];
      if(!matchedStaff.teaches.includes(act.sid))matchedStaff.teaches.push(act.sid);
    }
  }
  act.verifierEmail=vemail;
  act.verifierName=vname||act.verifierName||vemail.split('@')[0];
  save();
  if(AU_CONFIG.USE_BACKEND){
    toast('📨 Sending verification email to '+vemail+'...');
    AuAPI.requestVerification({
      activityId:act.id,
      activity:act,
      verifierEmail:vemail,
      verifierName:act.verifierName
    }).then(res=>{
      if(res&&res.accessCode){
        act.accessCode=res.accessCode;
        act.accessToken=res.token;
      }
      toast('✓ Verification email sent to '+vemail+'!');
    }).catch(e=>{
      toast('Could not send verification email: '+(e&&e.message||'Error'),'bad');
    });
  }
}

submits.saveAct=()=>{
  if(!need('add_acts'))return;const u=me(),t=fv('act.title').trim();ui.err={};
  if(!t){ui.err['act.title']='Give this activity a name.';return fail()}
  const actId=uid('a');
  const rawSearch=(fv('act.vsearch')||'').trim();
  const vemail=(fv('act.vemail')||(/^\S+@\S+\.\S+$/.test(rawSearch)?rawSearch:'')).trim();
  const vname=(fv('act.vname')||(vemail?vemail.split('@')[0]:'')).trim();
  const certFile=F['act.certFile']||null;

  const newAct={
    id:actId,
    sid:u.id,
    type:fv('act.type','achievement'),
    year:Number(fv('act.year',u.year)),
    title:t,
    where:fv('act.where').trim(),
    status:'waiting',
    created:Date.now(),
    evidence:certFile?certFile.name:fv('act.cert',''),
    evidenceData:certFile?certFile.data:'',
    evidenceFile:certFile?{name:certFile.name,size:certFile.size,type:certFile.type}:null,
    verifierEmail:vemail||'',
    verifierName:vname||'',
    verifierId:fv('act.vid',''),
    comments:[]
  };
  S.acts.push(newAct);
  save();
  if(AU_CONFIG.USE_BACKEND&&AuAPI.flush)AuAPI.flush();
  if(vemail){
    dispatchActivityVerification(newAct,vemail,vname);
  }
  ['act.title','act.where','act.cert','act.certFile','act.vid','act.vemail','act.vname','act.vsearch'].forEach(k=>delete F[k]);
  F['act.add']=false;render();toast('Saved. Waiting for verification.')
};
actions.delAct=el=>{S.acts=S.acts.filter(a=>a.id!==el.dataset.id);save();if(AU_CONFIG.USE_BACKEND&&AuAPI.flush)AuAPI.flush();render();toast('Entry removed.')};
actions.addEvidence=el=>{
  const a=S.acts.find(x=>x.id===el.dataset.id);
  F['ev.id']=el.dataset.id;F['ev.name']=a&&a.evidence||'';F['ev.file']=null;ui.err={};
  openModal('Attach Supporting Evidence',()=>`
    <p class="mb">Upload a certificate, official letter, or photo for <b>${esc(a?a.title:'this entry')}</b> so the lecturer or verifier can inspect and verify it.</p>
    <div class="field ${ui.err['ev.name']?'has-err':''}">
      <label for="ev_upload_file">Choose certificate or photo (PDF, JPG, PNG, WebP, Word)</label>
      <input id="ev_upload_file" type="file" accept="image/*,.pdf,.doc,.docx" aria-label="Evidence file">
      ${F['ev.file']?`<div class="chip ok mt">📎 Selected: <b>${esc(F['ev.file'].name)}</b> (${Math.round((F['ev.file'].size||0)/1024)} KB)</div>`:''}
      ${ui.err['ev.name']?`<div class="errmsg">${esc(ui.err['ev.name'])}</div>`:''}
    </div>
    <div class="row mt"><button class="btn pri" data-a="saveEvidence">Save &amp; Send Evidence</button><button class="btn" data-a="closeModal">Cancel</button></div>
  `);
};
actions.saveEvidence=()=>{
  const a=S.acts.find(x=>x.id===F['ev.id']);
  if(!a)return;
  const fileObj=F['ev.file'];
  if(!fileObj&&!fv('ev.name')){ui.err['ev.name']='Choose a file to attach first.';renderModal();return}
  if(fileObj){
    a.evidence=fileObj.name;
    a.evidenceData=fileObj.data;
    a.evidenceFile={name:fileObj.name,size:fileObj.size,type:fileObj.type};
  } else {
    a.evidence=fv('ev.name');
  }
  a.status='waiting';
  a.created=Date.now();
  ui.err={};
  save();
  if(AU_CONFIG.USE_BACKEND&&AuAPI.flush)AuAPI.flush();
  if(a.verifierEmail){
    dispatchActivityVerification(a,a.verifierEmail,a.verifierName);
  }
  closeModal();render();toast('Evidence uploaded and saved!')
};
actions.sendVerifyModal=el=>{
  const a=S.acts.find(x=>x.id===el.dataset.id);
  if(!a)return;
  F['sv.id']=a.id;
  F['sv.email']=a.verifierEmail||'';
  F['sv.name']=a.verifierName||'';
  ui.err={};
  openModal(`Send for Verification: ${a.title}`,()=>`
    <p class="mb">Enter the email address of the lecturer, supervisor, or external person who can verify <b>${esc(a.title)}</b>. They do not need an account—they will receive a secure verification link and 6-digit code.</p>
    ${fld('sv.name',{label:'Verifier Name',ph:'e.g. Dr. Riley Adams or Club Patron'})}
    ${fld('sv.email',{label:'Verifier Email Address',type:'email',ph:'verifier@africau.edu or external@org.com'})}
    <div class="row mt">
      <button class="btn pri" data-a="doSendVerify">📨 Send Verification Email</button>
      <button class="btn" data-a="closeModal">Cancel</button>
    </div>
  `);
};
actions.doSendVerify=()=>{
  const a=S.acts.find(x=>x.id===F['sv.id']);
  const email=(fv('sv.email')||'').trim();
  const name=(fv('sv.name')||email.split('@')[0]).trim();
  if(!email||!/^\S+@\S+\.\S+$/.test(email)){
    ui.err['sv.email']='Enter a valid email address.';
    renderModal();
    return;
  }
  ui.err={};
  closeModal();
  dispatchActivityVerification(a,email,name);
  render();
};
actions.printRecord=()=>{const u=me();openModal('My portfolio record',()=>`<div class="doc"><div class="dm">${esc(SCHOOL)}</div><h2>${esc(u.name)}</h2><div class="dm">${esc(u.schoolId)} · Year ${u.year} · ${esc(u.programme)} · Overall GPA ${fmt2(u.overall)} (certified)</div>
  ${Object.keys(TYPES).map(t=>`<h3 style="margin-top:16px">${TYPES[t]}</h3>${myActs(u.id).filter(a=>a.type===t).map(a=>`<div>${a.status==='verified'?'✓':'○'} ${esc(a.title)} · Year ${a.year}${a.where?' · '+esc(a.where):''} <span class="dm">(${a.status==='verified'?'verified':'not yet verified'})</span></div>`).join('')||'<div class="dm">None yet.</div>'}`).join('')}
  <h3 style="margin-top:16px">Projects</h3>${myProjects(u.id).map(p=>`<div><b>${esc(p.name)}</b> <span class="dm">${esc(p.kind)}</span> ${esc(p.result)}</div>`).join('')||'<div class="dm">None yet.</div>'}</div><div class="row noprint mt"><button class="btn pri" data-a="print">Print or save as PDF</button><button class="btn" data-a="closeModal">Close</button></div>`,{wide:true})};

/* letters */
const LSTATUS={waiting:['info','● Waiting for a reply'],accepted:['info','✎ Being written'],ready:['ok','✓ Ready to download'],declined:['bad','✕ Not available'],changes:['warn','✎ Being updated']};
function lettersPage(u){
  const mine=S.letters.filter(l=>l.sid===u.id).sort((a,b)=>b.created-a.created);
  const staffOpts=[['','Choose a staff member'],...S.users.filter(x=>x.role==='staff'&&x.status==='active').map(x=>[x.id,`${staffLabel(x)}, ${x.dept}`])];
  const query=(fv('lt.search')||'').trim().toLowerCase();
  const dirResults=query.length>=2?(S.users.filter(x=>(x.role==='staff'||x.role==='supervisor')&&x.status==='active'&&(x.name.toLowerCase().includes(query)||(x.email&&x.email.toLowerCase().includes(query))))):[];
  const selStaffId=fv('lt.staff');
  const selStaff=selStaffId?user(selStaffId):null;

  return `${crumbs([['Home','/student'],['My letters']])}<div class="pagehead"><div><h1>My letters</h1></div></div>
  <div class="banner info mb">ⓘ You can ask internal lecturers or any external supervisor/employer. If they don't have an account, the system will send them a secure link with a 6-digit access code so they can write and certify your letter directly!</div>
  <div class="card"><h3>Ask for a recommendation letter</h3><form data-submit="askLetter" novalidate>
   <div class="field ${ui.err['lt.staff']?'has-err':''}">
     <label for="lt_search">Search for recommender (lecturer, supervisor or outside employer)</label>
     <input id="lt_search" data-k="lt.search" data-live="recommenderSearch" value="${esc(fv('lt.search'))}" placeholder="⌕ Type recommender's name or email to search..." autocomplete="off">
     ${ui.err['lt.staff']?`<div class="errmsg">${esc(ui.err['lt.staff'])}</div>`:''}
     <div id="recommender_results" class="mt" style="max-height:160px;overflow-y:auto">
       ${query.length>=2?`<div class="list">${dirResults.map(s=>`<div class="item" style="cursor:pointer;padding:6px 10px" data-a="pickRecommender" data-id="${s.id}" data-name="${esc(s.name)}" data-email="${esc(s.email)}"><div><b>${esc(s.name)}</b> <span class="chip info sm" style="font-size:0.75rem">${esc(s.role)}</span><div class="muted small">${esc(s.dept||s.company||'Africa University')} · ${esc(s.email)}</div></div><button type="button" class="btn sm">Select</button></div>`).join('')}${/^\S+@\S+\.\S+$/.test(query)?`<div class="item" style="cursor:pointer;padding:6px 10px;background:var(--tint)" data-a="pickExternalRecommender" data-email="${esc(query)}"><div><b>Invite External: ${esc(query)}</b><div class="muted small">Person has no AU account? We'll email them a secure portal link &amp; access code.</div></div><button type="button" class="btn sm pri">Use this email</button></div>`:''}</div>`:''}
     </div>
   </div>
   <div class="grid g2">
     <div class="field"><label for="f_lt_name">Recommender's Full Name</label><input id="f_lt_name" data-k="lt.name" value="${esc(fv('lt.name',selStaff?selStaff.name:''))}" placeholder="e.g. Dr. Riley Adams or Mr. John Doe"></div>
     <div class="field"><label for="f_lt_email">Recommender's Email Address (real email)</label><input id="f_lt_email" type="email" data-k="lt.email" value="${esc(fv('lt.email',selStaff?selStaff.email:''))}" placeholder="recommender@example.com"></div>
   </div>
   <div class="grid g2">
    ${selF('lt.purpose',['Job application','Internship','Scholarship','Further study','Other'],{label:'What is the letter for?'})}
    ${fld('lt.due',{label:'When do you need it by?',type:'date',min:todayISO(),hint:'Give your writer at least two weeks.'})}
   </div>
   <div class="field">
     <div class="row between" style="align-items:center;margin-bottom:6px">
       <label for="f_lt_note">Anything you'd like them to mention? (or draft with AI below)</label>
       <div class="row" style="gap:8px">
         <input type="file" id="lt_file_input" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style="display:none">
         <button type="button" class="btn sm" data-a="triggerLetterUpload" title="Attach CV, certificates or transcripts">📎 Upload CV / Files</button>
         <button type="button" class="btn sm gold" data-a="aiDraftRequestEmail">✨ AI Draft Polite Request Email</button>
       </div>
     </div>
     <div class="lt-dropzone" id="lt_dropzone">
       <textarea id="f_lt_note" data-k="lt.note" rows="5" placeholder="Drag & drop your CV, certificates or transcripts directly into this box, or type your message here... e.g. I am applying for a Software Engineering internship at EcoCash. Please mention my final year project...">${esc(fv('lt.note'))}</textarea>
       <div class="drop-overlay">📥 Drop CV / files directly here to attach</div>
     </div>
     <div class="hint" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px">
       <span>💡 <b>Attach files directly:</b> Drag &amp; drop documents directly onto the textbox, paste from clipboard, or click <b>📎 Upload CV / Files</b>.</span>
       <span>Supports PDF, DOCX, TXT, Images (Max 15MB)</span>
     </div>
     ${(F['lt.attachments'] && F['lt.attachments'].length) ? `
       <div class="mt" style="background:var(--surface2,#f8fafc);border:1px solid var(--line,#cbd5e1);border-radius:8px;padding:10px 12px">
         <div style="font-size:0.85rem;font-weight:700;color:var(--ink,#0b1f3a);margin-bottom:8px">
           📎 Attached Files (${F['lt.attachments'].length}) — Will be accessible to your recommender:
         </div>
         <div class="row" style="flex-wrap:wrap;gap:8px">
           ${F['lt.attachments'].map(att => `
             <span class="att-chip">
               <span>📄 <b>${esc(att.name)}</b> <span class="muted small">(${att.size ? Math.round(att.size/1024) + ' KB' : ''})</span></span>
               <button type="button" class="rm" data-a="rmLetterAttachment" data-id="${att.id}" title="Remove attachment">×</button>
             </span>
           `).join('')}
         </div>
       </div>
     ` : ''}
   </div>
   <div class="field"><label>What can your writer see?</label>${chk('lt.s.grades','My grades',true)}${chk('lt.s.ach','My achievements',true)}${chk('lt.s.lead','My leadership roles',true)}${chk('lt.s.extra','My extracurricular activities',true)}</div>
   <button class="btn pri" type="submit">Send request via email</button></form></div>
  <div class="sect"><h2>My requests</h2>${mine.length?`<div class="stack">${mine.map(l=>{const s=user(l.staffId)||{name:l.recipientName||'External Recommender',dept:l.recipientEmail||'External'};const st=LSTATUS[l.status]||['info','● Active'],last=l.versions&&l.versions[l.versions.length-1];return `<div class="card"><div class="item"><div><b>${esc(l.recipientName||staffLabel(s))}</b><div class="muted small">${esc(l.recipientEmail||s.email||s.dept)} · ${esc(l.purpose)} · needed by ${fmtD(l.due)}</div></div><div class="row">${l.accessCode?`<span class="chip" style="font-family:monospace;background:var(--tint);border:1px solid var(--border)">Access Code: <b>${esc(l.accessCode)}</b></span>`:''}<span class="chip ${st[0]}">${st[1]}</span></div></div>
   ${l.note?`<div class="cmt mt"><span class="muted">Note sent:</span> ${esc(l.note)}</div>`:''}
    ${l.attachments && l.attachments.length ? `
      <div class="mt small" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span class="muted">Attached (${l.attachments.length}):</span>
        ${l.attachments.map(att => `<a class="chip sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px" href="${att.data}" download="${esc(att.name)}" target="_blank">📄 ${esc(att.name)} <span class="muted">(${att.size ? Math.round(att.size/1024) + 'KB' : ''})</span> ⬇</a>`).join(' ')}
      </div>
    ` : ''}
   ${l.status==='declined'?`<div class="cmt mt"><b>Reply:</b> ${esc(l.reply)}</div><div class="row mt"><button class="btn sm" data-a="askElse" data-id="${l.id}">Ask someone else</button></div>`:''}
   ${last&&(l.status==='ready'||l.status==='changes')?`<div class="row mt"><button class="btn sm pri" data-a="dlLetter" data-id="${l.id}">Download letter${l.versions.length>1?' (version '+last.n+')':''}</button>${l.status==='ready'?`<button class="btn sm" data-a="askChange" data-id="${l.id}" ${l.changesUsed>=2?'disabled':''}>Ask for changes</button>`:''}</div><p class="hint mt">${l.status==='changes'?'You asked for changes. You can still download the current version while you wait.':''} You can ask for changes up to 2 times (${l.changesUsed||0} used).${(l.changesUsed||0)>=2?' For more changes, please contact the staff member directly.':''}</p>`:''}</div>`}).join('')}</div>`:'<div class="empty">No requests yet. Search above to ask for your first letter.</div>'}</div>
  ${F['chg.id']?changePanel():''}`}

live.recommenderSearch=()=>{
  const el=document.getElementById('recommender_results');
  if(!el)return;
  const query=(fv('lt.search')||'').trim().toLowerCase();
  const dirResults=query.length>=2?(S.users.filter(x=>(x.role==='staff'||x.role==='supervisor')&&x.status==='active'&&(x.name.toLowerCase().includes(query)||(x.email&&x.email.toLowerCase().includes(query))))):[];
  el.innerHTML=query.length>=2?`<div class="list">${dirResults.map(s=>`<div class="item" style="cursor:pointer;padding:6px 10px" data-a="pickRecommender" data-id="${s.id}" data-name="${esc(s.name)}" data-email="${esc(s.email)}"><div><b>${esc(s.name)}</b> <span class="chip info sm" style="font-size:0.75rem">${esc(s.role)}</span><div class="muted small">${esc(s.dept||s.company||'Africa University')} · ${esc(s.email)}</div></div><button type="button" class="btn sm">Select</button></div>`).join('')}${/^\S+@\S+\.\S+$/.test(query)?`<div class="item" style="cursor:pointer;padding:6px 10px;background:var(--tint)" data-a="pickExternalRecommender" data-email="${esc(query)}"><div><b>Invite External: ${esc(query)}</b><div class="muted small">Person has no AU account? We'll email them a secure portal link &amp; access code.</div></div><button type="button" class="btn sm pri">Use this email</button></div>`:''}</div>`:'';
};
actions.pickRecommender=el=>{
  F['lt.staff']=el.dataset.id;
  F['lt.name']=el.dataset.name;
  F['lt.email']=el.dataset.email;
  F['lt.search']=el.dataset.name;
  render();
};
actions.pickExternalRecommender=el=>{
  F['lt.staff']='';
  F['lt.email']=el.dataset.email;
  F['lt.name']=el.dataset.email.split('@')[0];
  F['lt.search']=el.dataset.email;
  render();
};
actions.aiDraftRequestEmail=()=>{
  const u=me();
  const recName=fv('lt.name')||(fv('lt.staff')?user(fv('lt.staff'))?.name:'Professor / Supervisor');
  const purp=fv('lt.purpose','Job application');
  const existingNotes=fv('lt.note','');
  toast('🤖 Gemini AI is drafting your formal recommendation request email...');
  AuAPI.aiDraftEmail({
    studentName: u.name,
    studentProgramme: u.programme,
    recipientName: recName,
    purpose: purp,
    notes: existingNotes,
    deadline: fv('lt.due')
  }).then(res=>{
    const draftedText = (res && (res.draft || res.emailText)) || '';
    if(draftedText){
      F['lt.note']=draftedText;
      render();
      toast('✨ Request email drafted! You can review or edit it before sending.');
    } else {
      toast('AI returned an empty response. Please try again.', 'bad');
    }
  }).catch(e=>{
    toast('AI Draft failed: '+(e&&e.message||'Unknown error'),'bad');
  });
};

submits.askLetter=()=>{
  if(!need('ask_letter'))return;
  const u=me();ui.err={};
  const sid=fv('lt.staff');
  const email=(fv('lt.email')||'').trim();
  const name=(fv('lt.name')||'').trim();
  const due=fv('lt.due');

  if(!email||!/^\S+@\S+\.\S+$/.test(email)){
    ui.err['lt.staff']='Enter a valid recommender email or select a staff member from the search.';
  }
  if(!due)ui.err['lt.due']='Choose the date you need the letter by.';
  else if(new Date(due+'T23:59:59')<new Date())ui.err['lt.due']='Choose a date that is today or later.';
  if(Object.keys(ui.err).length)return fail();

  const g=k=>F['lt.s.'+k]!==undefined?F['lt.s.'+k]:true;
  const share={grades:g('grades'),ach:g('ach'),lead:g('lead'),extra:g('extra')};
  const purpose=fv('lt.purpose','Job application');
  const note=fv('lt.note','').trim();

  toast('📨 Sending letter request and access code via email...');
  if(AU_CONFIG.USE_BACKEND){
    const attachments = Array.isArray(F['lt.attachments']) ? F['lt.attachments'] : [];
    AuAPI.requestLetter({
      recipientEmail: email,
      recipientName: name||email.split('@')[0],
      staffId: sid||null,
      purpose: purpose,
      due: due,
      note: note,
      attachments: attachments,
      share: share
    }).then(res=>{
      if(res&&res.letter){
        S.letters.unshift(res.letter);
        save();
        ['lt.staff','lt.name','lt.email','lt.search','lt.due','lt.note','lt.attachments'].forEach(k=>delete F[k]);
        render();
        toast('✓ Request sent successfully to '+email+' with 6-digit access code' + (attachments.length ? ` and ${attachments.length} attachment(s)` : '') + '!');
      }
    }).catch(err=>{
      toast('Could not send email: '+(err&&err.message||'Server error'),'bad');
    });
  } else {
    // Offline / demo fallback
    const code=String(Math.floor(100000+Math.random()*900000));
    const attachments = Array.isArray(F['lt.attachments']) ? F['lt.attachments'] : [];
    S.letters.push({
      id:uid('l'),sid:u.id,staffId:sid||null,recipientEmail:email,recipientName:name||email.split('@')[0],
      purpose:purpose,due:new Date(due+'T12:00:00').getTime(),note:note,attachments:attachments,share:share,
      status:'waiting',reply:'',versions:[],changeRequests:[],changesUsed:0,draft:'',accessCode:code,created:Date.now()
    });
    save();['lt.staff','lt.name','lt.email','lt.search','lt.due','lt.note','lt.attachments'].forEach(k=>delete F[k]);render();
    toast('Request saved! Access code: '+code);
  }
};
actions.askElse=el=>{const l=S.letters.find(x=>x.id===el.dataset.id);F['lt.purpose']=l.purpose;F['lt.note']=l.note;F['lt.staff']='';F['lt.search']='';render();setTimeout(()=>{const e=document.getElementById('lt_search');if(e){e.scrollIntoView&&e.scrollIntoView({block:'center'});e.focus()}},30)};

/* ======================= STAFF ======================= */
function teaches(u,sid){
  if(!u||!sid)return false;
  if((u.teaches||[]).includes(sid))return true;
  const uEmail=(u.email||'').toLowerCase();
  // Also include if student assigned an activity or letter to this staff member
  if(S.acts.some(a=>a.sid===sid&&(a.verifierId===u.id||(uEmail&&a.verifierEmail&&a.verifierEmail.toLowerCase()===uEmail)||a.status==='waiting')))return true;
  if(S.letters.some(l=>l.sid===sid&&l.staffId===u.id))return true;
  return false;
}
const taught=u=>S.users.filter(s=>s.role==='student'&&s.status==='active'&&teaches(u,s.id));
function studentRow(s,base,btn){return `<div class="item"><div class="row" style="flex-wrap:nowrap">${avatar(s,44)}<div><b>${esc(s.name)}</b><div class="muted small">${esc(s.schoolId)} · Year ${s.year} · ${esc(s.programme)}</div></div></div><a class="btn sm" href="#${base}/${s.schoolId}">${btn||'Open portfolio'}</a></div>`}
function studentListHtml(list,base,q,limit){
  const t=(q||'').trim().toLowerCase();const m=t?list.filter(s=>s.name.toLowerCase().includes(t)||s.schoolId.toLowerCase().includes(t)):list;
  const shown=limit&&!t?m.slice(0,limit):m;
  if(!m.length)return `<div class="empty">${t?`No student matches "${esc(q)}". Check the spelling or try the school ID, like 2023-0148.`:'No students are linked to you yet.'}</div>`;
  return `<div class="list">${shown.map(s=>studentRow(s,base)).join('')}</div><p class="hint mt">Showing ${shown.length} of ${list.length} ${list.length===1?'student':'students'}.${shown.length<m.length||t?'':' Search to find anyone else.'}</p>`}
live.staffSearch=()=>{const el=document.getElementById('live-staffSearch');const u=me();if(!el||!u)return;el.innerHTML=studentListHtml(u.role==='staff'?taught(u):supStudents(u),'/'+u.role+'/students',fv('st.q'),u.role==='staff'&&location.hash.split('/').length<=2?3:0)};

function staffHome(u){
  const uEmail=(u.email||'').toLowerCase();
  const list=taught(u);
  const entries=S.acts.filter(a=>a.status==='waiting'&&user(a.sid)&&user(a.sid).status==='active'&&(teaches(u,a.sid)||a.verifierId===u.id||(uEmail&&a.verifierEmail&&a.verifierEmail.toLowerCase()===uEmail))).sort((a,b)=>b.created-a.created);
  const mineL=S.letters.filter(l=>l.staffId===u.id&&openLetters(l));
  const soon=mineL.filter(l=>daysTo(l.due)<=14).length,newW=entries.filter(a=>Date.now()-a.created<7*DAY).length;
  const wait=mineL.filter(l=>l.status==='waiting'||l.status==='changes');
  return `<div class="hello">${avatar(u,72,true)}<div><h1>Good morning, ${esc(first(u.name))}</h1><p class="muted">${esc(u.title)} · ${esc(u.dept)}</p></div></div>
  <div class="grid g3"><div class="stat"><div class="l">Students you teach</div><div class="n">${list.length}</div></div><div class="stat"><div class="l">Entries to check</div><div class="n">${entries.length}</div><div class="d" style="color:var(--warn)">${newW} new this week</div></div><div class="stat"><div class="l">Letters to write</div><div class="n">${mineL.length}</div><div class="d" style="color:var(--warn)">${soon} ${soon===1?'is':'are'} due soon</div></div></div>
  <div class="card mb" style="background:var(--tint);border-left:4px solid var(--pri)">
    <div class="row between" style="align-items:center;flex-wrap:wrap;gap:10px">
      <div>
        <h3 style="margin:0">Opportunities &amp; Attachment Board</h3>
        <p class="muted small" style="margin:2px 0 0">Post research assistantships, hackathon calls, and industrial attachments for Africa University students.</p>
      </div>
      <div class="row">
        <a class="btn sm pri" href="#/staff/opportunities">Browse &amp; Post Opportunities →</a>
      </div>
    </div>
  </div>
  <h2 class="sect">Needs your attention</h2>
  <div class="grid g2"><div class="card"><h3>Entries to check (${entries.length})</h3>${entries.length?`<div class="list">${entries.slice(0,8).map(a=>{const s=user(a.sid);const hasEv=!!(getActEvidenceData(a)||a.evidence);return `<div class="item"><div><b>${esc(s.name)}</b><div class="muted small">${esc(a.title)} · ${esc(TYPE1[a.type])}${hasEv?' · <span style="color:var(--ok);font-weight:600">📎 Evidence attached</span>':''}</div></div><a class="btn sm pri" href="#/staff/students/${s.schoolId}">Review &amp; Verify</a></div>`}).join('')}</div>`:'<div class="empty">All caught up. New entries will show here.</div>'}</div>
  <div class="card"><h3>Letter requests</h3>${mineL.length?`<div class="list">${mineL.sort((a,b)=>a.due-b.due).slice(0,3).map(l=>`<div><div class="item"><div><b>${esc(user(l.sid).name)}</b><div class="muted small">${esc(l.purpose)}</div></div>${dueLabel(l.due)}</div><a class="btn sm" style="margin-top:8px" href="#/staff/letters">${l.status==='accepted'?'Write letter':l.status==='changes'?'Update letter':'Reply to request'}</a></div>`).join('')}</div>`:'<div class="empty">No letters waiting. Requests from students will show here.</div>'}</div></div>
  <h2 class="sect">Find a student</h2><div class="card">${can('view_taught')?`<div class="field"><input data-k="st.q" data-live="staffSearch" value="${esc(fv('st.q'))}" placeholder="⌕ Type a name or school ID" aria-label="Search students"></div><div id="live-staffSearch">${studentListHtml(list,'/staff/students',fv('st.q'),3)}</div>`:'<div class="empty">Your role cannot view student portfolios right now. Ask the administrator.</div>'}</div>`}
function staffStudents(u){return `${crumbs([['Home','/staff'],['My students']])}<h1 class="mb">My students</h1>${can('view_taught')?`<div class="card"><div class="field"><input data-k="st.q" data-live="staffSearch" value="${esc(fv('st.q'))}" placeholder="⌕ Type a name or school ID" aria-label="Search students"></div><div id="live-staffSearch">${studentListHtml(taught(u),'/staff/students',fv('st.q'),0)}</div></div>`:'<div class="empty">Your role cannot view student portfolios right now. Ask the administrator.</div>'}`}

/* review a portfolio (staff) */
function reviewPage(u,sid){
  const s=S.users.find(x=>x.schoolId===sid&&x.role==='student');
  if(!s||!teaches(u,s.id)||!can('view_taught'))return `${crumbs([['Home','/staff'],['My students']])}<div class="empty">You can only open students you teach. <a href="#/staff/students">Back to my students</a></div>`;
  const ft=fv('rv.ft','all'),ps=myProjects(s.id),acts=myActs(s.id);
  const items=[];
  acts.filter(a=>ft==='all'||ft==='act'&&a.type==='extra'||ft===a.type).forEach(a=>items.push({k:'a',o:a}));
  if(ft==='all'||ft==='proj')ps.forEach(p=>items.push({k:'p',o:p}));
  const mine=S.assess.filter(a=>a.sid===s.id&&a.by===u.id).sort((a,b)=>b.at-a.at)[0];
  const sn=S.notes.filter(x=>x.sid===s.id).sort((a,b)=>b.wk-a.wk).slice(0,3);
  const as=k=>F['as.'+k]!==undefined?F['as.'+k]:(mine?mine.r[k]:0);
  const openC=fv('rv.c','');
  const cbox=o=>openC===o.id?`<div class="mt stack" style="gap:6px">${o.comments.map(cmtHtml).join('')}<div class="row" style="flex-wrap:nowrap"><div class="field grow" style="margin:0"><input data-k="rv.cm" value="${esc(fv('rv.cm'))}" placeholder="Write a comment" aria-label="Write a comment"></div><button class="btn sm" data-a="postCmt" data-id="${o.id}" data-kind="${o.title!==undefined?'a':'p'}">Post</button></div><div class="hint">${esc(first(s.name))} can see your comments.</div></div>`:'';
  return `${crumbs([['Home','/staff'],['My students','/staff/students'],[s.name]])}
  <div class="pagehead"><div class="hello" style="margin:0">${avatar(s,64)}<div><h1>${esc(s.name)}</h1><p class="muted">${esc(s.schoolId)} · Year ${s.year} · ${esc(s.programme)}</p></div></div><div class="row" style="gap:10px"><div class="stat" style="margin:0"><div class="l">Cumulative GPA</div><div class="n" style="font-size:1.5rem">${s.overall==null?'–':fmt2(s.overall)}</div><div class="d" style="color:var(--ok)">✓ Certified</div></div><button class="btn" data-a="transcript" data-id="${s.id}">📄 View Transcript</button></div></div>
  <div class="grid g21"><div class="stack">
   <div class="card"><h3>About ${esc(first(s.name))}</h3><p>${esc(s.bio)||'<span class="muted">No bio yet.</span>'}</p><div class="tags mt">${(s.skills||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><h4 class="cert-sub">Certifications</h4>${certsHtml(s,false)}<p class="small muted mt">${esc(s.email)} · ${esc(s.phone)}<br>${esc(s.linkedin)} · ${esc(s.github)}</p></div>
   <div><h2 class="mb">Entries and projects</h2><div class="tabs">${[['all','Everything'],['achievement','Achievements'],['leadership','Leadership'],['act','Activities'],['proj',`Projects (${ps.length})`]].map(([v,l])=>`<button data-a="setF" data-k="rv.ft" data-v="${v}" aria-pressed="${ft===v}">${l}</button>`).join('')}</div>
   ${items.length?`<div class="stack">${items.map(({k,o})=>k==='a'?`<div class="card"><div class="item"><div><b>${esc(o.title)}</b><div class="muted small">${TYPE1[o.type]} · Year ${o.year}${o.where?' · '+esc(o.where):''}</div></div>${statusChip(o.status)}</div>
    ${evidenceHtml(o)}
    <div class="row mt">${o.status!=='verified'?`<button class="btn sm pri" data-a="verify" data-id="${o.id}">✓ Verify Entry</button>${o.status!=='evidence'?`<button class="btn sm" data-a="askEv" data-id="${o.id}">Ask for evidence</button>`:''}`:''}<button class="btn sm" data-a="toggleC" data-id="${o.id}">Comments (${o.comments.length})</button></div>${cbox(o)}</div>`:`<div class="card"><div class="item"><div><b>${esc(o.name)}</b><div class="muted small">Project · ${esc(o.kind)}</div></div><span class="muted small">Read and comment</span></div><p class="small mt">${esc(o.result||o.goal)}</p><div class="row mt">${link(o.live)?`<a class="btn sm" href="${esc(link(o.live))}" target="_blank" rel="noopener">Open live version</a>`:''}${link(o.code)?`<a class="btn sm" href="${esc(link(o.code))}" target="_blank" rel="noopener">View code</a>`:''}<button class="btn sm" data-a="toggleC" data-id="${o.id}">Comments (${o.comments.length})</button></div>${cbox(o)}</div>`).join('')}</div>`:'<div class="empty">Nothing in this filter yet.</div>'}</div></div>
  <div class="stack"><div class="card"><h3>Your assessment</h3><p class="hint mb">1 means needs work, 5 means excellent. ${esc(first(s.name))} will see this.</p>
   ${[['leadership','Leadership'],['teamwork','Teamwork'],['communication','Communication']].map(([k,l])=>`<div class="ratingrow"><span>${l}</span>${ratings('as.'+k,as(k))}</div>`).join('')}
   ${fld('as.fb',{label:`Feedback for ${esc(first(s.name))} (optional)`,ta:true,rows:4,def:mine?mine.feedback:''})}
   ${ui.err.as?`<div class="errmsg mb">${esc(ui.err.as)}</div>`:''}<button class="btn pri" style="width:100%" data-a="saveAssess" data-id="${s.id}">Save assessment</button>${mine?`<p class="hint mt">Last saved ${fmtD(mine.at)}.</p>`:''}</div>
   ${sn.length?`<div class="card"><h3>Supervisor notes</h3><div class="list">${sn.map(x=>`<div><b>Week ${x.wk}</b> <span class="muted small">· ${esc(user(x.by).name)}</span><p class="small">${esc(x.text)}</p></div>`).join('')}</div></div>`:''}</div></div>`}
function findEntry(id){return S.acts.find(a=>a.id===id)||S.projects.find(p=>p.id===id)}
actions.toggleC=el=>{F['rv.c']=fv('rv.c')===el.dataset.id?'':el.dataset.id;F['rv.cm']='';render()};
actions.postCmt=el=>{if(!need('comment_rate'))return;const o=findEntry(el.dataset.id),t=fv('rv.cm').trim();if(!t){toast('Write a comment first.','bad');return}o.comments.push({by:me().id,text:t,at:Date.now()});F['rv.cm']='';save();render();toast('Comment posted.')};
actions.verify=el=>{if(!need('verify'))return;const a=S.acts.find(x=>x.id===el.dataset.id);a.status='verified';a.verifiedBy=me().id;save();render();toast('Entry verified.')};
actions.askEv=el=>{if(!need('verify'))return;const a=S.acts.find(x=>x.id===el.dataset.id);a.status='evidence';if(!a.comments.some(c=>c.text.startsWith('Please add evidence')))a.comments.push({by:me().id,text:'Please add evidence, like a certificate or a letter, so I can verify this.',at:Date.now()});save();render();toast('Asked the student for evidence.')};
actions.saveAssess=el=>{if(!need('comment_rate'))return;const u=me(),sid=el.dataset.id,r={};let any=false;['leadership','teamwork','communication'].forEach(k=>{const v=F['as.'+k]!==undefined?F['as.'+k]:0;if(v){r[k]=v;any=true}});
  const prev=S.assess.find(a=>a.sid===sid&&a.by===u.id);const fb=(F['as.fb']!==undefined?F['as.fb']:(prev?prev.feedback:'')).trim();
  if(!any&&!fb&&!(prev&&Object.keys(prev.r).length)){ui.err.as='Give at least one rating or write some feedback.';return fail()}
  const rr=Object.assign({},prev?prev.r:{},r);ui.err={};
  S.assess=S.assess.filter(a=>!(a.sid===sid&&a.by===u.id));S.assess.push({sid,by:u.id,r:rr,feedback:fb,at:Date.now()});save();render();toast('Assessment saved. The student can see it.')};

/* letter requests (staff) */
function staffLetters(u){
  const mine=S.letters.filter(l=>l.staffId===u.id),tb=fv('lq.t','new');
  const groups={new:mine.filter(l=>l.status==='waiting'),changes:mine.filter(l=>l.status==='changes'),prog:mine.filter(l=>l.status==='accepted'),sent:mine.filter(l=>l.status==='ready')};
  const empty={new:'No new requests. When a student asks you for a letter, it shows here.',changes:'No change requests. If a student wants a letter updated, it shows here.',prog:'Nothing in progress. Accept a request to start writing.',sent:'No letters sent yet.'};
  const list=groups[tb].sort((a,b)=>a.due-b.due);
  const card=l=>{const s=user(l.sid);return `<div class="card"><div class="item"><div class="row" style="flex-wrap:nowrap">${avatar(s,44)}<div><b>${esc(s.name)}</b><div class="muted small">${esc(l.purpose)}${l.status==='changes'?` · Change request ${l.changesUsed} of 2`:''}</div></div></div>${l.status==='changes'?'<span class="chip info">✎ Changes requested</span>':dueLabel(l.due)}</div>
   ${l.note?`<div class="cmt mt"><span class="muted">Message from student:</span> ${esc(l.note)}</div>`:''}
   ${l.attachments&&l.attachments.length?`<div class="mt" style="background:var(--tint,#f8fafc);border:1px solid var(--line,#cbd5e1);border-radius:6px;padding:8px 12px"><b>📎 Attached documents (${l.attachments.length}):</b><div class="row mt" style="gap:6px;flex-wrap:wrap">${l.attachments.map(att=>`<a class="chip sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px" href="${att.data}" download="${esc(att.name)}" target="_blank">📄 ${esc(att.name)} <span class="muted">(${att.size?Math.round(att.size/1024)+'KB':''})</span> ⬇</a>`).join('')}</div></div>`:''}${l.status==='changes'?`<div class="cmt mt"><span class="muted">What ${esc(first(s.name))} wants changed:</span> ${esc(l.changeRequests[l.changeRequests.length-1].text)}</div>`:''}
   <div class="row mt">${l.status==='waiting'?(F['lq.d']===l.id?'':`<button class="btn sm pri" data-a="acceptLetter" data-id="${l.id}">Accept</button><button class="btn sm" data-a="openDecline" data-id="${l.id}">Decline</button>`):''}${l.status==='accepted'?`<a class="btn sm pri" href="#/staff/letters/write/${l.id}">Write letter</a>`:''}${l.status==='changes'?`<a class="btn sm pri" href="#/staff/letters/update/${l.id}">Update letter</a>`:''}${l.status==='ready'?`<button class="btn sm" data-a="viewSent" data-id="${l.id}">View sent letter</button>`:''}</div>
   ${F['lq.d']===l.id?`<div class="card tint mt"><b>Tell ${esc(first(s.name))} why, so they can ask someone else</b><div class="field mt ${ui.err['lq.r']?'has-err':''}"><input data-k="lq.r" value="${esc(fv('lq.r'))}" placeholder="I am on leave until December and cannot meet your deadline." aria-label="Reason">${ui.err['lq.r']?`<div class="errmsg">${esc(ui.err['lq.r'])}</div>`:'<div class="hint">A short reason is required before the reply can be sent.</div>'}</div><div class="row"><button class="btn pri sm" data-a="sendDecline" data-id="${l.id}">Send reply</button><button class="btn sm" data-a="cancelDecline">Cancel</button></div></div>`:''}</div>`};
  return `${crumbs([['Home','/staff'],['Letter requests']])}<div class="pagehead"><div><h1>Letter requests</h1><p class="sub">Accept or decline requests, then write and send each letter.</p></div></div>
  <div class="tabs">${[['new','New'],['changes','Changes requested'],['prog','In progress'],['sent','Sent']].map(([v,l])=>`<button data-a="setF" data-k="lq.t" data-v="${v}" aria-pressed="${tb===v}">${l} (${groups[v].length})</button>`).join('')}</div>
  ${list.length?`<div class="stack">${list.map(card).join('')}</div>`:`<div class="empty">${empty[tb]}</div>`}`}
actions.acceptLetter=el=>{if(!need('write_letters'))return;const l=S.letters.find(x=>x.id===el.dataset.id);l.status='accepted';save();F['lq.t']='prog';render();toast('Accepted. The student has been told. Write the letter when you are ready.')};
actions.openDecline=el=>{F['lq.d']=el.dataset.id;F['lq.r']='';ui.err={};render()};
actions.cancelDecline=()=>{delete F['lq.d'];ui.err={};render()};
actions.sendDecline=el=>{const r=fv('lq.r').trim();if(!r){ui.err['lq.r']='Write a short reason so the student can ask someone else.';return fail()}const l=S.letters.find(x=>x.id===el.dataset.id);l.status='declined';l.reply=r;save();delete F['lq.d'];ui.err={};render();toast('Reply sent.')};
actions.viewSent=el=>{const l=S.letters.find(x=>x.id===el.dataset.id);openModal('Sent letter',()=>letterDocHtml(l,l.versions[l.versions.length-1]),{wide:true})};

/* letter editor */
const TEMPLATES={scholarship:['Scholarship',(n,s)=>`To the scholarship committee,\n\nI am writing in support of ${n}. Their academic record and [achievement] show real promise.\n\n[A specific example of their work]\n\nI strongly support their application.\n\nYours faithfully,\n${s}`],job:['Job application',(n,s)=>`Dear hiring manager,\n\nIt is my pleasure to recommend ${n}. In my class they showed [strength].\n\n[A specific example of their work]\n\nI am confident they would be a valuable team member.\n\nYours sincerely,\n${s}`],ref:['Standard reference',(n,s)=>`To whom it may concern,\n\n${n} has studied with me in [course]. I found them [qualities].\n\n[A specific example]\n\nI am happy to recommend them.\n\nYours sincerely,\n${s}`]};
function letterEditor(u,id){
  const l=S.letters.find(x=>x.id===id&&x.staffId===u.id);if(!l||l.status!=='accepted')return `<div class="empty">That letter isn't open for writing. <a href="#/staff/letters">Back to letter requests</a></div>`;
  const s=user(l.sid),tk=l.purpose==='Scholarship'?'scholarship':l.purpose==='Job application'||l.purpose==='Internship'?'job':'ref';
  const body=fv('le.body',l.draft||TEMPLATES[tk][1](s.name,staffLabel(u)));
  const sProjs=myProjects(s.id),sActs=myActs(s.id).filter(a=>a.status==='verified');
  return `${crumbs([['Home','/staff'],['Letter requests','/staff/letters'],[s.name]])}<div class="pagehead"><h1>Letter for ${esc(s.name)}</h1><a class="btn" href="#/staff/letters">← Back to requests</a></div>
  <div class="grid g21"><div class="card letter-edit"><div class="tpl-bar mb"><div class="grow" style="min-width:180px">${selF('le.tpl',Object.entries(TEMPLATES).map(([k,v])=>[k,v[0]]),{label:'Start from a template',def:tk})}</div><div class="row" style="gap:8px"><button class="btn sm" type="button" data-a="useTpl" data-id="${l.id}">Use this template</button><button class="btn sm pri" type="button" data-a="aiDraftLetter" data-id="${l.id}">✨ AI Draft with Gemini</button></div></div>
   <div class="field ${ui.err['le.body']?'has-err':''}"><label for="le_body">Your letter</label><textarea id="le_body" data-k="le.body" rows="14">${esc(body)}</textarea>${ui.err['le.body']?`<div class="errmsg">${esc(ui.err['le.body'])}</div>`:'<div class="hint">Review or adjust the letter details before signing.</div>'}</div>
   <div class="row"><button class="btn" data-a="saveDraft" data-id="${l.id}">Save draft</button><button class="btn pri" data-a="sendLetter" data-id="${l.id}">Sign and send</button></div></div>
  <div class="stack"><div class="card"><h3>What ${esc(first(s.name))} shared with you</h3><p class="muted small mb">For: <b>${esc(l.purpose)}</b> · due ${fmtD(l.due)}</p>${l.note?`<div class="cmt mb">${esc(l.note)}</div>`:''}
  ${l.attachments&&l.attachments.length?`<div class="card mb tint" style="border:1px solid var(--brand,#c49a45)"><b>📎 Candidate Documents (${l.attachments.length})</b><p class="muted small mb">Uploaded by student:</p><div class="stack" style="gap:6px">${l.attachments.map(att=>`<div class="att-row"><span class="small" style="min-width:0;flex:1">📄 <b>${esc(att.name)}</b> <span class="muted">(${att.size?Math.round(att.size/1024)+'KB':''})</span></span><a class="btn sm pri" href="${att.data}" download="${esc(att.name)}" target="_blank">Download ⬇</a></div>`).join('')}</div></div>`:''}
  ${l.share.grades&&s.overall!=null?`<div class="stat mb"><div class="l">Cumulative GPA</div><div class="n" style="font-size:1.45rem;color:var(--ok)">${fmt2(s.overall)}</div><div class="d">✓ Certified by Registry</div></div>`:''}
  <div class="stack" style="gap:4px">${[['grades','My grades'],['ach','My achievements'],['lead','My leadership roles'],['extra','My extracurricular activities']].map(([k,t])=>`<div>${l.share[k]?'<span style="color:var(--ok)">✓</span>':'<span style="color:var(--muted)">✕</span>'} ${t}${l.share[k]?'':' <span class="muted small">(not shared)</span>'}</div>`).join('')}</div>
  ${sProjs.length?`<div class="mt"><b class="small">Projects (${sProjs.length}):</b><div class="muted small" style="margin-top:4px">${sProjs.slice(0,3).map(p=>`• ${esc(p.name)} (${esc(p.kind)})`).join('<br>')}</div></div>`:''}
  ${sActs.length?`<div class="mt"><b class="small">Verified Activities (${sActs.length}):</b><div class="muted small" style="margin-top:4px">${sActs.slice(0,3).map(a=>`• ${esc(a.title)}`).join('<br>')}</div></div>`:''}
  <a class="btn sm mt" style="margin-top:14px;width:100%" href="#/staff/students/${s.schoolId}">Open ${esc(first(s.name))}'s portfolio</a></div></div></div>`}
actions.useTpl=el=>{const l=S.letters.find(x=>x.id===el.dataset.id),s=user(l.sid),u=me();F['le.body']=TEMPLATES[fv('le.tpl','job')][1](s.name,staffLabel(u));render()};
actions.aiDraftLetter=el=>{
  const l=S.letters.find(x=>x.id===el.dataset.id),s=user(l.sid),u=me();
  toast('🤖 Drafting personalized letter with Gemini AI...');
  AuAPI.aiLetter({
    student: s,
    lecturer: u,
    purpose: l.purpose,
    specificNote: l.note,
    projects: myProjects(s.id),
    activities: myActs(s.id),
    gpa: s.overall
  }).then(r=>{
    if(r&&r.letter){
      F['le.body']=r.letter;
      render();
      toast('✨ Letter draft generated by Gemini AI! Review and sign.');
    }
  }).catch(e=>{
    toast('AI Generation error: '+(e&&e.message||'Failed to generate'),'bad');
  });
};
actions.saveDraft=el=>{const l=S.letters.find(x=>x.id===el.dataset.id);if(F['le.body']!==undefined)l.draft=F['le.body'];save();toast('Draft saved.')};
function sendLetterFlow(el,isUpdate){
  if(!need('write_letters'))return;const l=S.letters.find(x=>x.id===el.dataset.id),b=fv('le.body',l.draft).trim();
  if(!b){ui.err['le.body']='A letter cannot be sent empty. Write your letter first.';return fail()}
  const ph=b.match(/\[[^\]]+\]/g);if(ph){ui.err['le.body']=`Replace the placeholder ${ph[0]} (and any others in brackets) with real details before sending.`;return fail()}
  const n=l.versions.length+1;l.versions.push({n,body:b,sent:Date.now(),seen:false});l.status='ready';l.draft='';save();ui.err={};go('/staff/letters',{'lq.t':'sent'});toast(isUpdate?'Updated letter sent. The student has been told.':'Letter signed and sent. The student can download it now.')}
actions.sendLetter=el=>sendLetterFlow(el,false);
function letterUpdater(u,id){
  const l=S.letters.find(x=>x.id===id&&x.staffId===u.id);if(!l||l.status!=='changes')return `<div class="empty">That letter has no open change request. <a href="#/staff/letters">Back to letter requests</a></div>`;
  const s=user(l.sid),last=l.versions[l.versions.length-1],req=l.changeRequests[l.changeRequests.length-1];
  const body=fv('le.body',l.draft||last.body);
  return `${crumbs([['Home','/staff'],['Letter requests','/staff/letters'],[s.name]])}<div class="pagehead"><h1>Update letter for ${esc(s.name)}</h1><a class="btn" href="#/staff/letters">← Back to requests</a></div>
  <div class="banner info mb"><b>${esc(first(s.name))} asked for changes (request ${l.changesUsed} of 2)</b><br>“${esc(req.text)}”</div>
  <div class="grid g21"><div class="card letter-edit"><div class="field ${ui.err['le.body']?'has-err':''}"><label for="le_body">Your letter (version ${last.n+1}, draft)</label><textarea id="le_body" data-k="le.body" rows="14">${esc(body)}</textarea>${ui.err['le.body']?`<div class="errmsg">${esc(ui.err['le.body'])}</div>`:''}</div><div class="row"><button class="btn" data-a="saveDraft" data-id="${l.id}">Save draft</button><button class="btn pri" data-a="sendUpdate" data-id="${l.id}">Sign and send updated letter</button></div></div>
  <div class="card"><h3>Versions</h3><div class="list"><div class="item"><div><b>Version ${last.n+1}</b><div class="muted small">Draft, you are editing this</div></div><span class="chip warn">✎ Draft</span></div>${l.versions.slice().reverse().map(v=>`<div class="item"><div><b>Version ${v.n}</b><div class="muted small">Sent ${fmtD(v.sent)}</div></div><button class="btn sm" data-a="viewVer" data-id="${l.id}" data-n="${v.n}">View</button></div>`).join('')}</div><p class="hint mt">${esc(first(s.name))} can still download version ${last.n} until you send the update. They will be told when the new version is ready.</p>${l.changesUsed>=2?'<p class="hint mt">This is the last update. Any further changes happen by the student contacting you directly.</p>':''}</div></div>`}
actions.sendUpdate=el=>sendLetterFlow(el,true);
actions.viewVer=el=>{const l=S.letters.find(x=>x.id===el.dataset.id),v=l.versions.find(x=>x.n===Number(el.dataset.n));openModal('Version '+v.n,()=>letterDocHtml(l,v),{wide:true})};

/* ======================= SUPERVISOR ======================= */
const supStudents=u=>S.users.filter(s=>s.role==='student'&&s.status==='active'&&s.attach&&s.attach.supId===u.id&&Date.now()<=s.attach.end+DAY);
const attWeek=a=>Math.max(1,Math.min(Math.round((a.end-a.start)/(7*DAY)),Math.floor((Date.now()-a.start)/(7*DAY))+1));
const attWeeks=a=>Math.round((a.end-a.start)/(7*DAY));
const hasNote=(sid,wk)=>S.notes.some(n=>n.sid===sid&&n.wk===wk);
function supHome(u){
  const list=supStudents(u);if(!can('view_taught'))return '<div class="empty">Your role cannot view student portfolios right now. Ask the administrator.</div>';
  const due=list.filter(s=>!hasNote(s.id,attWeek(s.attach))),ending=list.filter(s=>s.attach.end-Date.now()<=21*DAY);
  return `<div class="hello">${avatar(u,72,true)}<div><h1>Good morning, ${esc(first(u.name))}</h1><p class="muted">${esc(u.company)} · ${esc(u.dept)}</p></div></div>
  <div class="grid g3"><div class="stat"><div class="l">Students with you</div><div class="n">${list.length}</div></div><div class="stat"><div class="l">Progress notes due</div><div class="n">${due.length}</div><div class="d" style="color:var(--warn)">Due this week</div></div><div class="stat"><div class="l">Attachments ending soon</div><div class="n">${ending.length}</div><div class="d" style="color:var(--warn)">${ending.length?`Ends in ${Math.min(...ending.map(s=>Math.max(0,daysTo(s.attach.end))))} days`:'None right now'}</div></div></div>
  <h2 class="sect">Needs your attention</h2><div class="card">${due.length||ending.length?`<div class="list">${due.map(s=>`<div class="item"><span>● <b>${esc(s.name)}</b>: week ${attWeek(s.attach)} progress note is due Friday</span><a class="btn sm pri" href="#/supervisor/students/${s.schoolId}">Write note</a></div>`).join('')}${ending.map(s=>`<div class="item"><span>⏱ <b>${esc(s.name)}</b>: attachment ends in ${plural(Math.max(0,daysTo(s.attach.end)),'day')}. Final report needed.</span><a class="btn sm" href="#/supervisor/students/${s.schoolId}">Start report</a></div>`).join('')}</div>`:'<div class="empty">Nothing needs doing right now.</div>'}</div>
  <h2 class="sect">Students on attachment with you</h2><div class="card">${list.length?`<div class="list">${list.map(s=>{const wk=attWeek(s.attach),tot=attWeeks(s.attach),end=s.attach.end-Date.now()<=21*DAY;return `<div class="item"><div class="row" style="flex-wrap:nowrap">${avatar(s,44)}<div><b>${esc(s.name)}</b><div class="muted small">${esc(s.programme)} · Year ${s.year}</div><div class="row small"><div class="bar" style="width:120px;margin:0"><i style="width:${wk/tot*100}%"></i></div>Week ${wk} of ${tot}</div></div></div><div class="row"><span class="chip ${end?'warn':'ok'}">${end?'● Ending soon':'✓ On track'}</span><a class="btn sm" href="#/supervisor/students/${s.schoolId}">Open portfolio</a></div></div>`}).join('')}</div>`:'<div class="empty">No students are linked to you right now. The school links students when an attachment starts.</div>'}</div>
  <p class="hint mt">You only see the students the school has linked to you, and only while their attachment runs.</p>`}
function supStudentsPage(u){return `${crumbs([['Home','/supervisor'],['My students']])}<h1 class="mb">My students</h1><div class="card"><div class="field"><input data-k="st.q" data-live="staffSearch" value="${esc(fv('st.q'))}" placeholder="⌕ Type a name or school ID" aria-label="Search students"></div><div id="live-staffSearch">${studentListHtml(supStudents(u),'/supervisor/students',fv('st.q'),0)}</div></div>`}
function supPortfolio(u,sid){
  const s=S.users.find(x=>x.schoolId===sid&&x.role==='student');
  if(!s||!supStudents(u).includes(s)||!can('view_taught'))return `${crumbs([['Home','/supervisor'],['My students']])}<div class="empty">You can only open students the school has linked to you. <a href="#/supervisor/students">Back to my students</a></div>`;
  const a=s.attach,wk=attWeek(a),tot=attWeeks(a),tab=fv('sp.tab','overview'),ps=myProjects(s.id),acts=myActs(s.id),notes=S.notes.filter(n=>n.sid===s.id).sort((x,y)=>y.wk-x.wk);
  const cur=notes.find(n=>n.wk===wk),rv=k=>F['pn.'+k]!==undefined?F['pn.'+k]:(cur?cur.r[k]:0),fin=S.finals[s.id];
  const pl=p=>`<div class="item"><div><b>${esc(p.name)}</b><div class="muted small">${esc(p.kind)}${p.result?' · '+esc(p.result):''}</div></div><span class="row">${link(p.live)?`<a class="btn sm" href="${esc(link(p.live))}" target="_blank" rel="noopener">Live</a>`:''}${link(p.code)?`<a class="btn sm" href="${esc(link(p.code))}" target="_blank" rel="noopener">Code</a>`:''}</span></div>`;
  let left;
  if(tab==='projects')left=`<div class="card"><h3>Projects</h3>${ps.length?`<div class="list">${ps.map(p=>`<div>${pl(p)}<p class="small mt">${esc(p.goal)}</p></div>`).join('')}</div>`:'<div class="empty">No projects yet.</div>'}</div>`;
  else if(tab==='grades')left=`<div class="card"><div class="row between mb"><h3 style="margin:0">Grades &amp; Semester Courses</h3><button class="btn sm pri" data-a="transcript" data-id="${s.id}">📄 View Full Transcript</button></div><p class="mb">Cumulative GPA <b>${s.overall==null?'–':fmt2(s.overall)}</b> <span style="color:var(--ok)">✓ Certified, read only</span> · ${fmt2(creditsDone(s))} Credit Hours</p><div class="tw"><table><thead><tr><th>Semester</th><th class="c">Credit Hours</th><th class="c">Weighted Points</th><th class="c">Semester GPA</th><th class="c">CGPA</th></tr></thead><tbody>${Array.from({length:semCount(s)},(_,i)=>{const st=semStats(s,i),cu=cumStats(s,i);return `<tr><td><b>Sem-${i+1}</b> (Year ${Math.floor(i/2)+1}, Sem ${i%2+1})</td><td class="c">${fmt2(st.credits)}</td><td class="c">${fmt2(st.weighted)}</td><td class="c"><b>${fmt2(st.gpa)}</b></td><td class="c"><b>${fmt2(cu.cgpa)}</b></td></tr>`}).join('')}</tbody></table></div></div>`;
  else if(tab==='acts')left=`<div class="card"><h3>Activities</h3>${acts.length?`<div class="list">${acts.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted small">${TYPES[x.type]} · Year ${x.year}</div></div>${statusChip(x.status)}</div>`).join('')}</div>`:'<div class="empty">No activities yet.</div>'}</div>`;
  else left=`<div class="stack"><div class="card"><h3>About ${esc(first(s.name))}</h3><p>${esc(s.bio)||'<span class="muted">No bio yet.</span>'}</p><div class="tags mt">${(s.skills||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><h4 class="cert-sub">Certifications</h4>${certsHtml(s,false)}<p class="small muted mt">${esc(s.email)} · ${esc(s.phone)}<br>${esc(s.linkedin)} · ${esc(s.github)}</p></div>
   <div class="card"><h3>Projects</h3>${ps.length?`<div class="list">${ps.slice(0,2).map(pl).join('')}</div>${ps.length>2?`<p class="hint mt">${esc(ps[2].name)}${ps.length>3?' and '+(ps.length-3)+' more':''}. See the Projects tab.</p>`:''}`:'<div class="empty">No projects yet.</div>'}</div>
   <div class="grid g2"><div class="stat"><div class="l">Overall GPA</div><div class="n">${s.overall==null?'–':fmt2(s.overall)}</div><div class="d" style="color:var(--ok)">✓ Certified, read only</div></div><div class="stat"><div class="l">Activities</div><div class="n">${acts.length}</div><div class="d muted">${acts.filter(x=>x.status==='verified').length} verified by teachers</div></div></div></div>`;
  return `${crumbs([['Home','/supervisor'],['My students','/supervisor/students'],[s.name]])}
  <div class="pagehead"><div class="hello" style="margin:0">${avatar(s,64)}<div><h1>${esc(s.name)}</h1><p class="muted">${esc(s.schoolId)} · Year ${s.year} · ${esc(s.programme)}</p></div></div><div class="stat"><div class="l">Attachment at ${esc(a.company)}</div><div class="n" style="font-size:1.4rem">Week ${wk} of ${tot}</div><div class="bar"><i style="width:${wk/tot*100}%"></i></div><div class="d muted">${fmtD(a.start)} to ${fmtD(a.end)}</div></div></div>
  <div class="banner info mb">ⓘ You can see this student's whole portfolio: profile, projects, grades, activities and contact details.</div>
  <div class="tabs">${[['overview','Overview'],['projects',`Projects (${ps.length})`],['grades','Grades'],['acts','Activities']].map(([v,l])=>`<button data-a="setF" data-k="sp.tab" data-v="${v}" aria-pressed="${tab===v}">${l}</button>`).join('')}</div>
  <div class="grid g21"><div>${left}</div><div class="stack"><div class="card mb" style="background:var(--tint);border-left:4px solid var(--pri)">
    <div class="row between" style="align-items:center;flex-wrap:wrap;gap:10px">
      <div>
        <h3 style="margin:0">Company Attachment Slots</h3>
        <p class="muted small" style="margin:2px 0 0">Post new internship opportunities or review students who applied with their certified portfolios.</p>
      </div>
      <a class="btn sm pri" href="#/supervisor/opportunities">Manage Opportunities →</a>
    </div>
  </div>
  <div class="card"><h3>Progress during the attachment</h3><p class="hint mb">1 means needs work, 5 means excellent.</p>
   ${[['punct','Punctuality'],['qual','Quality of work'],['team','Teamwork']].map(([k,l])=>`<div class="ratingrow"><span>${l}</span>${ratings('pn.'+k,rv(k))}</div>`).join('')}
   ${fld('pn.text',{label:`This week's note (week ${wk})`,ta:true,rows:3,def:cur?cur.text:'',ph:'What did they deliver this week?'})}
   ${ui.err.pn?`<div class="errmsg mb">${esc(ui.err.pn)}</div>`:''}<button class="btn pri" style="width:100%" data-a="saveNote" data-id="${s.id}">Save progress note</button><p class="hint mt">${esc(first(s.name))} and their lecturers can see your notes.</p>
   <h4 class="mt2" style="margin-bottom:6px">Earlier notes</h4>${notes.filter(n=>n.wk!==wk).length?`<div class="list">${notes.filter(n=>n.wk!==wk).slice(0,4).map(n=>`<div><div class="item"><b>Week ${n.wk}</b><span class="muted small">${fmtD(n.at)}</span></div><div class="small">${esc(n.text)}</div></div>`).join('')}</div>`:'<p class="muted small">No earlier notes yet.</p>'}
   <div class="item mt2"><div><b>Final attachment report</b><div class="muted small">${fin?'Submitted '+fmtD(fin.at):'Due '+fmtD(a.end)}</div></div><button class="btn sm" data-a="finalReport" data-id="${s.id}">${fin?'View report':'Start report'}</button></div></div></div></div>`}
actions.saveNote=el=>{if(!need('add_notes'))return;const u=me(),s=user(el.dataset.id),wk=attWeek(s.attach),cur=S.notes.find(n=>n.sid===s.id&&n.wk===wk);
  const r={};let any=false;[['punct'],['qual'],['team']].forEach(([k])=>{const v=F['pn.'+k]!==undefined?F['pn.'+k]:(cur?cur.r[k]:0);if(v){r[k]=v;any=true}});
  const text=(F['pn.text']!==undefined?F['pn.text']:(cur?cur.text:'')).trim();
  if(!text){ui.err.pn="Write this week's note before saving.";return fail()}
  S.notes=S.notes.filter(n=>!(n.sid===s.id&&n.wk===wk));S.notes.push({sid:s.id,wk,r,text,at:Date.now(),by:u.id});ui.err={};save();render();toast(`Week ${wk} note saved.`)};
actions.finalReport=el=>{const s=user(el.dataset.id),fin=S.finals[s.id];F['fr.sum']=fin?fin.sum:'';F['fr.rec']=fin?fin.rec:'yes';ui.err={};
  openModal('Final attachment report',()=>`<p class="muted mb">${esc(s.name)} · ${esc(s.attach.company)} · ${fmtD(s.attach.start)} to ${fmtD(s.attach.end)}</p>${fld('fr.sum',{label:'Summary of the attachment',ta:true,rows:6,hint:'What did they achieve? What should they work on next?'})}${selF('fr.rec',[['yes','Yes, I would recommend them'],['maybe','Yes, with reservations'],['no','Not at this time']],{label:'Would you recommend them for a graduate role?'})}<div class="row"><button class="btn pri" data-a="saveFinal" data-id="${s.id}">Submit report</button><button class="btn" data-a="closeModal">Cancel</button></div>`,{wide:true})};
actions.saveFinal=el=>{if(!need('add_notes'))return;const t=fv('fr.sum').trim();if(!t){ui.err['fr.sum']='Write a short summary before submitting.';renderModal();return}S.finals[el.dataset.id]={sum:t,rec:fv('fr.rec','yes'),at:Date.now(),by:me().id};ui.err={};save();closeModal();render();toast('Final report submitted.')};

/* ======================= ADMIN ======================= */
const CUR_YEAR='2026/27',PREV_YEAR='2025/26';
function adminHome(u){
  const yr=fv('ad.yr',CUR_YEAR),cur=yr===CUR_YEAR;
  const st=students(),stf=S.users.filter(x=>x.role==='staff'&&x.status==='active');
  const pend=S.users.filter(x=>x.status==='pending'),old=oldEntries(),over=overdueLetters();
  const done=st.filter(s=>isComplete(s.id)).length,pct=st.length?Math.round(done/st.length*100):0;
  const yrs=[1,2,3,4].map(y=>{const g=st.filter(s=>s.year===y),gp=g.filter(s=>s.overall!=null);return {y,gpa:gp.length?gp.reduce((a,s)=>a+s.overall,0)/gp.length:null,pct:g.length?Math.round(g.filter(s=>isComplete(s.id)).length/g.length*100):null}});
  const best=yrs.filter(x=>x.gpa!=null).slice(-1)[0],bestP=yrs.filter(x=>x.pct!=null).slice(-1)[0];
  const dash=v=>cur?v:'–';
  return `<div class="pagehead"><div class="hello" style="margin:0">${avatar(u,72,true)}<div><h1>Hello, ${esc(first(u.name))}</h1><p class="muted">${esc(u.dept)}</p></div></div><div style="min-width:190px">${selF('ad.yr',[CUR_YEAR,PREV_YEAR].map(y=>[y,'Academic year: '+y]),{r:1})}</div></div>
  ${cur?'':`<div class="banner mb">Figures for ${PREV_YEAR} are held by the registry office and are not loaded in this prototype. Switch back to ${CUR_YEAR} to see live numbers.</div>`}
  <div class="grid g4"><div class="stat"><div class="l">People with accounts</div><div class="n">${dash(S.users.filter(x=>['active','deactivated'].includes(x.status)).length.toLocaleString())}</div></div><div class="stat"><div class="l">Students</div><div class="n">${dash(st.length.toLocaleString())}</div></div><div class="stat"><div class="l">Staff</div><div class="n">${dash(stf.length.toLocaleString())}</div></div><div class="stat"><div class="l">Portfolios completed</div><div class="n">${dash(pct+'%')}</div><div class="bar"><i style="width:${cur?pct:0}%"></i></div></div></div>
  <p class="hint mt">A portfolio is complete when it has at least one entry in each section: projects, achievements, leadership and extracurricular.</p>
  <h2 class="sect">Needs your attention</h2><div class="card">${cur?`<div class="list">
   ${[[pend.length,'new sign-ups','are waiting for you to approve them','Review sign-ups','review','bad'],[old.length,'student entries','have waited over 30 days to be checked','See entries','entries','warn'],[over.length,'letter requests','are past their due date','See requests','requests','warn']].map(([n,a,b,btn,act,c])=>n?`<div class="item"><span><span style="color:var(--${c})">●</span> <b>${n} ${n===1?a.replace(/s$/,'').replace('entrie','entry'):a}</b> ${n===1?b.replace('are ','is ').replace('have ','has '):b}</span><button class="btn sm" data-a="adm_${act}">${btn}</button></div>`:`<div class="item"><span style="color:var(--ok)">✓ No ${a} ${act==='review'?'waiting':'overdue'}</span></div>`).join('')}</div>`:'<div class="empty">Nothing to show for this year.</div>'}</div>
  <div class="grid g2 mt"><div class="card"><h3>Average overall GPA</h3><p class="hint mb">By year group, out of 4.0</p>${yrs.map(x=>`<div class="hbar ${best&&x.y===best.y?'hi':''}"><span>Year ${x.y}</span><div class="t"><i style="width:${cur&&x.gpa?x.gpa/4*100:0}%"></i></div><b>${cur&&x.gpa?x.gpa.toFixed(2):'–'}</b></div>`).join('')}</div>
  <div class="card"><h3>Portfolios completed</h3><p class="hint mb">By year group</p>${yrs.map(x=>`<div class="hbar ${bestP&&x.y===bestP.y?'hi':''}"><span>Year ${x.y}</span><div class="t"><i style="width:${cur&&x.pct!=null?x.pct:0}%"></i></div><b>${cur&&x.pct!=null?x.pct+'%':'–'}</b></div>`).join('')}</div></div>
  <div class="card mt"><h3>Recent activity</h3><div class="list">${S.log.slice(0,4).map(l=>`<div class="item"><span>${esc(l.text)}</span><span class="muted small">${fmtWhen(l.ts)}</span></div>`).join('')}</div></div>`}
actions.adm_review=()=>go('/admin/people');
actions.adm_entries=()=>openModal('Entries waiting over 30 days',()=>{const o=oldEntries();return `<div class="list">${o.map(a=>`<div class="item"><div><b>${esc(a.title)}</b><div class="muted small">${esc(user(a.sid).name)} · waiting ${Math.floor((Date.now()-a.created)/DAY)} days</div></div>${statusChip(a.status)}</div>`).join('')||'<div class="empty">None right now.</div>'}</div><p class="hint mt">Remind the teachers who teach these students to check them.</p>`});
actions.adm_requests=()=>openModal('Letter requests past their due date',()=>{const o=overdueLetters();return `<div class="list">${o.map(l=>`<div class="item"><div><b>${esc(user(l.sid).name)}</b><div class="muted small">Asked ${esc(staffLabel(user(l.staffId)))} · ${esc(l.purpose)}</div></div>${dueLabel(l.due)}</div>`).join('')||'<div class="empty">None right now.</div>'}</div>`});

/* people */
const ROLE_FILTER=[['all','All roles'],['student','Students'],['Lecturer','Lecturers'],['Teacher','Teachers'],['supervisor','Supervisors'],['admin','Administrators']];
const roleText=x=>x.role==='student'?`Student · ${x.schoolId}`:x.role==='staff'?`${x.title} · ${x.dept} · ${x.email}`:x.role==='supervisor'?`Supervisor · ${x.company} · ${x.email}`:`Administrator · ${x.email}`;
function peopleList(){
  const q=fv('pp.q').trim().toLowerCase(),rf=fv('pp.role','all'),sf=fv('pp.status','all'),u=me();
  const m=S.users.filter(x=>['active','deactivated'].includes(x.status)).filter(x=>rf==='all'||x.role===rf||x.title===rf).filter(x=>sf==='all'||x.status===sf).filter(x=>!q||[x.name,x.email,x.schoolId||''].some(v=>v.toLowerCase().includes(q)));
  if(!m.length)return `<div class="empty">No one matches. Try a different name, email or school ID, or clear the filters.</div>`;
  return `<div class="list">${m.map(x=>`<div class="item"><div class="row" style="flex-wrap:nowrap">${avatar(x,44)}<div><b>${esc(x.name)}</b><div class="muted small">${esc(roleText(x))}</div></div></div><div class="row">${x.role==='student'?`<button class="btn sm" data-a="manageGrades" data-id="${x.id}" title="Upload courses & manage transcript">Grades &amp; Courses${x.overall!=null?`: ${fmt2(x.overall)}`:''}</button><button class="btn sm" data-a="transcript" data-id="${x.id}" title="View or download official transcript">📄 Transcript</button>`:''}${x.status==='active'?'<span class="chip ok">✓ Active</span>':'<span class="chip mute">Deactivated</span>'}${x.id===u.id?'':x.status==='active'?`<button class="btn sm" data-a="deact" data-id="${x.id}">Deactivate</button>`:`<button class="btn sm" data-a="react" data-id="${x.id}">Reactivate</button>`}</div></div>`).join('')}</div>`}
live.people=()=>{const el=document.getElementById('live-people');if(el)el.innerHTML=peopleList()};
function peoplePage(u){
  const pend=S.users.filter(x=>x.status==='pending'),add=fv('pp.add',false),role=fv('ps.role','Lecturer');
  const stu=students();
  return `${crumbs([['Home','/admin'],['People']])}<div class="pagehead"><div><h1>People</h1><p class="sub">Create staff accounts, approve student sign-ups, and manage every account.</p></div><div class="row"><button class="btn" data-a="importStudents">Import students from a file</button><button class="btn pri" data-a="togglePP">Add staff or supervisor</button></div></div>
  ${add?`<div class="card mb"><h3>Add staff or supervisor</h3><form data-submit="createStaff" novalidate><div class="grid g2">${fld('ps.name',{label:'Full name',ph:'Casey Brooks'})}${fld('ps.email',{label:'Work email',type:'email',ph:'casey.brooks@acme.example'})}${selF('ps.role',['Lecturer','Teacher','Supervisor'],{label:'Role',r:1,def:'Lecturer'})}${fld('ps.dept',{label:role==='Supervisor'?'Company':'Department',ph:role==='Supervisor'?'Acme Ltd':'Computing'})}${fld('ps.pw',{label:'Initial password',ph:'demo1234 (default if empty)',hint:'Staff member will be prompted to set their own password.'})}</div>
   <div class="field"><label>${role==='Supervisor'?'Students they supervise':'Students they teach'}</label><div class="card tint" style="max-height:170px;overflow:auto;padding:10px 14px">${stu.map(s=>chk('ps.s.'+s.id,`${esc(s.name)} <span class="muted small">${esc(s.schoolId)}${s.attach&&role==='Supervisor'?' · already linked to a supervisor':''}</span>`)).join('')}</div><div class="hint">${role==='Supervisor'?"They only see the students you link here, and only while the attachment runs.":'They only see the students you tick here.'}</div></div>
   ${role==='Supervisor'?`<div class="grid g2">${fld('ps.start',{label:'Attachment starts',type:'date',def:todayISO()})}${fld('ps.end',{label:'Attachment ends',type:'date',def:new Date(Date.now()+84*DAY).toISOString().slice(0,10)})}</div>`:''}
   <p class="hint mb">The user can sign in immediately using this initial password and will be prompted to set a personal password.</p><div class="row"><button class="btn pri" type="submit">Create account</button><button type="button" class="btn" data-a="togglePP">Cancel</button></div></form></div>`:''}
  <div class="card mb"><h3>Waiting for approval (${pend.length})</h3><p class="muted small mb">Students and industrial supervisors who registered. Review their details before activating.</p>${pend.length?`<div class="list">${pend.map(x=>`<div><div class="item"><div><b>${esc(x.name)}</b> ${x.role==='supervisor'?'<span class="chip" style="background:var(--pri);color:#fff;margin-left:6px">Industrial Supervisor</span>':'<span class="chip" style="margin-left:6px">Student</span>'}<div class="small" style="color:var(--${x.role==='supervisor'?'ok':(x.signup&&x.signup.match?'ok':'warn')})">${x.role==='supervisor'?`✓ Company: <b>${esc(x.company||'Partner Employer')}</b> · Work email: ${esc(x.email)} · Phone: ${esc(x.phone||'–')}`:((x.signup&&x.signup.match?'✓ ':'▲ ')+esc(x.schoolId)+' · '+(x.signup&&x.signup.match?'Details match school records':"Details don't match"))}</div>${x.role!=='supervisor'&&x.signup&&!x.signup.match?x.signup.issues.map(i=>`<div class="muted small">${esc(i)}</div>`).join(''):''}</div><div class="row">${x.role==='supervisor'?`<button class="btn sm pri" data-a="approve" data-id="${x.id}">Approve Supervisor</button>`:(x.signup&&x.signup.match?`<button class="btn sm pri" data-a="approve" data-id="${x.id}">Approve</button>`:`<button class="btn sm" data-a="correct" data-id="${x.id}">Ask them to correct it</button>`)}<button class="btn sm" data-a="reject" data-id="${x.id}">Reject</button></div></div></div>`).join('')}</div>`:'<div class="empty">No sign-ups are waiting. New student and supervisor sign-ups will show here.</div>'}</div>
  <h2 class="mb">Everyone</h2><div class="card"><div class="row mb" style="align-items:flex-start"><div class="field grow" style="margin:0"><input data-k="pp.q" data-live="people" value="${esc(fv('pp.q'))}" placeholder="⌕ Search by name, email or school ID" aria-label="Search people"></div><div style="min-width:140px">${selF('pp.role',ROLE_FILTER,{lv:'people'})}</div><div style="min-width:150px">${selF('pp.status',[['all','All statuses'],['active','Active'],['deactivated','Deactivated']],{lv:'people'})}</div></div><div id="live-people">${peopleList()}</div><p class="hint mt">Accounts are deactivated, never deleted, so student records stay safe.</p></div>`}
actions.togglePP=()=>{F['pp.add']=!fv('pp.add',false);ui.err={};render()};
submits.createStaff=()=>{if(!need('manage_accounts'))return;const name=fv('ps.name').trim(),email=fv('ps.email').trim(),role=fv('ps.role','Lecturer'),dept=fv('ps.dept').trim();ui.err={};
  if(!name)ui.err['ps.name']="Enter the person's full name.";
  if(!/^\S+@\S+\.\S+$/.test(email))ui.err['ps.email']='Enter a work email, like name@school.edu.';else if(S.users.some(x=>x.email.toLowerCase()===email.toLowerCase()))ui.err['ps.email']='There is already an account with this email.';
  if(!dept)ui.err['ps.dept']=role==='Supervisor'?'Enter the company they work for.':'Enter their department.';
  const rawPw=fv('ps.pw').trim()||'demo1234';
  const ids=students().filter(s=>F['ps.s.'+s.id]).map(s=>s.id);
  let st,en;if(role==='Supervisor'){st=new Date(fv('ps.start',todayISO())+'T00:00:00').getTime();en=new Date(fv('ps.end')||new Date(Date.now()+84*DAY).toISOString().slice(0,10)+'T00:00:00').getTime();if(!(en>st))ui.err['ps.end']='The end date must be after the start date.'}
  if(Object.keys(ui.err).length)return fail();
  const id=uid('u');
  if(role==='Supervisor'){S.users.push({id,role:'supervisor',name,company:dept,dept:'Workplace supervisor',email,password:rawPw,mustChangePassword:true,status:'active',photo:null});ids.forEach(sid=>{user(sid).attach={supId:id,company:dept,start:st,end:en}})}
  else S.users.push({id,role:'staff',hon:role==='Lecturer'?'Dr.':'Mr./Ms.',name,title:role,dept,email,teaches:ids,password:rawPw,mustChangePassword:true,status:'active',photo:null});
  if(role!=='Supervisor')user(id).hon='';
  addLog(`Account created for ${name}`);save();
  if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
  Object.keys(F).filter(k=>k.startsWith('ps.')).forEach(k=>delete F[k]);F['pp.add']=false;render();toast(`Account created for ${name}. Initial password: ${rawPw} (they will set their own on sign in).`)};
actions.approve=el=>{
  const x=user(el.dataset.id);x.status='active';
  const rec=S.registry.find(r=>r.schoolId===x.schoolId);
  if(rec){
    if(rec.programme)x.programme=rec.programme;
    if(rec.year)x.year=rec.year;
    if(rec.overall!=null)x.overall=rec.overall;
    if(rec.gpas&&rec.gpas.length)x.gpas=clone(rec.gpas);
  }
  addLog(`${x.name} was approved`);save();
  if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
  render();toast(`${x.name} approved. They can sign in now.`);
};
actions.correct=el=>{const x=user(el.dataset.id);x.status='correction';addLog(`${x.name} was asked to correct their sign-up`);save();render();toast(`${x.name} was asked to correct their details.`)};
actions.reject=el=>{const x=user(el.dataset.id);x.status='rejected';addLog(`${x.name}'s sign-up was rejected`);save();render();toast('Sign-up rejected.')};
actions.deact=el=>{const x=user(el.dataset.id);if(!need('manage_accounts'))return;x.status='deactivated';addLog(`${x.name} was deactivated`);save();render();toast(`${x.name} deactivated. Their records are kept.`)};
actions.react=el=>{const x=user(el.dataset.id);if(!need('manage_accounts'))return;x.status='active';addLog(`${x.name} was reactivated`);save();render();toast(`${x.name} reactivated.`)};

/* ---------- Course & Transcript Text/CSV Parser ---------- */
function parseTranscriptCoursesText(rawText, existingSems){
  const sems=existingSems&&existingSems.length?clone(existingSems):[{label:'Sem-1',courses:[]}];
  let curSemIdx=0;
  const ensureSem=label=>{
    const clean=label.replace(/\s+/g,'-').replace(/^sem(?:ester)?[-_]?(\d+)$/i,'Sem-$1');
    let idx=sems.findIndex(s=>s.label.toLowerCase()===clean.toLowerCase());
    if(idx<0){sems.push({label:clean,courses:[]});idx=sems.length-1;}
    return idx;
  };
  const lines=String(rawText||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  const touchedSems=new Set();

  lines.forEach(line=>{
    // Ignore headers or summary lines
    if(/^(course\s*code|grade\s*point\s*average|cumulative\s*grade|unofficial\s*transcript|official\s*transcript|scan\s*to\s*verify|page\s*\d)/i.test(line))return;
    // Detect Sem-1 / Semester 1 header line
    const semMatch=line.match(/^(Sem(?:ester)?[-\s]*\d+)(?:\s+\1)?$/i);
    if(semMatch){
      curSemIdx=ensureSem(semMatch[1]);
      return;
    }
    // Format A: CSV with optional Sem prefix: "Sem-1, CSC1101, Principles of Programming Languages, 12.00, 2.90, B-"
    // or "CSC1101, Principles of Programming Languages, 12.00, 2.90, B-"
    if(line.includes(',')){
      const parts=line.split(',').map(x=>x.trim());
      let offset=0;
      if(/^sem(?:ester)?[-\s]*\d+$/i.test(parts[0])){
        curSemIdx=ensureSem(parts[0]);
        offset=1;
      }
      const code=parts[offset], name=parts[offset+1];
      if(code&&name&&/^[A-Z]{2,4}\s*\d{3,4}/i.test(code)){
        const cr=parseFloat(parts[offset+2])||12.00;
        let wt=parseFloat(parts[offset+3]);
        let gr=(parts[offset+4]||'').toUpperCase().replace(/[^\w+-]/g,'');
        if(!gr&&parts[offset+3]&&/^[A-DF][+-]?$/i.test(parts[offset+3])){
          gr=parts[offset+3].toUpperCase();
          wt=AU_WEIGHTS[gr]!==undefined?AU_WEIGHTS[gr]:3.0;
        }
        if(!gr)gr='B';
        if(isNaN(wt))wt=AU_WEIGHTS[gr]!==undefined?AU_WEIGHTS[gr]:3.0;
        if(!touchedSems.has(curSemIdx)){sems[curSemIdx].courses=[];touchedSems.add(curSemIdx);}
        sems[curSemIdx].courses.push({code:code.toUpperCase().replace(/\s+/g,''),name,credits:cr,weight:wt,grade:gr});
        added++;
        return;
      }
    }
    // Format B: Direct copy-paste from Africa University Transcript PDF:
    // e.g. "CSC1101 Principles of Programming Languages 12.00 2.90 B-"
    const pdfMatch=line.match(/^([A-Z]{2,4}\s?\d{3,4}[A-Z]?)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*([A-DF][+-]?|\ufffd?)$/i);
    if(pdfMatch){
      const code=pdfMatch[1].toUpperCase().replace(/\s+/g,'');
      const name=pdfMatch[2].trim();
      const cr=parseFloat(pdfMatch[3])||12.00;
      const wt=parseFloat(pdfMatch[4]);
      let gr=pdfMatch[5].toUpperCase().replace(/[^A-DF+-]/g,'');
      // If PDF OCR stripped the minus sign (like "B" at weight 2.90), infer exact grade from AU weight!
      if(wt===2.9&&gr==='B')gr='B-';
      if(wt===3.7&&gr==='A')gr='A-';
      if(wt===1.7&&gr==='C')gr='C-';
      if(!gr){
        const found=Object.entries(AU_WEIGHTS).find(([,w])=>Math.abs(w-wt)<0.05);
        gr=found?found[0]:'B';
      }
      if(!touchedSems.has(curSemIdx)){sems[curSemIdx].courses=[];touchedSems.add(curSemIdx);}
      sems[curSemIdx].courses.push({code,name,credits:cr,weight:isNaN(wt)?(AU_WEIGHTS[gr]||3.0):wt,grade:gr});
      added++;
    }
  });
  return {sems,added};
}

function syncTranscriptToStudent(s,tr){
  if(!s||!tr)return;
  const map=getTranscriptMap();
  const cleanSems=(tr.semesters||[]).filter(sem=>Array.isArray(sem.courses)&&sem.courses.length>0);
  tr.semesters=cleanSems;
  s.transcript=clone(tr);
  if(s.schoolId)map[s.schoolId]=clone(tr);
  if(s.id)map[s.id]=clone(tr);

  if(cleanSems.length>0){
    let totCr=0,totWt=0;
    const gpas=[];
    cleanSems.forEach(sem=>{
      const cr=sem.courses.reduce((a,c)=>a+(Number(c.credits)||0),0);
      const wt=sem.courses.reduce((a,c)=>a+(Number(c.credits)||0)*(Number(c.weight)||0),0);
      const gpa=cr>0?Math.round((wt/cr)*100)/100:0;
      gpas.push(gpa);
      totCr+=cr;
      totWt+=wt;
    });
    s.gpas=gpas;
    s.overall=totCr>0?Math.round((totWt/totCr)*100)/100:s.overall;
    const rec=S.registry.find(r=>r.schoolId===s.schoolId);
    if(rec){
      rec.overall=s.overall;
      rec.gpas=clone(s.gpas);
    }
  }
}

actions.importStudents=()=>{
  F['imp.text']='';F['imp.file']='';ui.err={};
  openModal('Import students, grades & semester courses',()=>`
    <p class="mb">Upload a CSV/text file, or paste rows below. You can import <b>student records</b> AND <b>semester courses</b> together:</p>
    <div class="card tint mb small" style="padding:10px 14px">
      <div><b>1. Student Row Format:</b> <code>School ID, Name, AU Email, Year, Programme, Overall GPA, Semester GPAs</code></div>
      <div class="muted" style="margin-bottom:6px">Example: <code>250933, Tendai Mushayapokuvaka, mushayapokuvakat@africau.edu, 1, Bachelor of Science Honours in Software Engineering, 3.52, 3.52</code></div>
      <div><b>2. Course Row Format:</b> <code>COURSE, School ID, Semester, Course Code, Course Title, Credit Hours, Weight, Grade</code></div>
      <div class="muted">Example: <code>COURSE, 250933, Sem-1, CSC1101, Principles of Programming Languages, 12.00, 2.90, B-</code></div>
    </div>
    <div class="field"><input type="file" accept=".csv,text/csv,text/plain" data-a-file="1" id="impfile" aria-label="CSV file"></div>
    ${fld('imp.text',{label:'Or paste student and course rows',ta:true,rows:7,ph:'250933, Tendai Mushayapokuvaka, mushayapokuvakat@africau.edu, 1, Bachelor of Science Honours in Software Engineering, 3.52, 3.52\nCOURSE, 250933, Sem-1, CSC1101, Principles of Programming Languages, 12.00, 2.90, B-\nCOURSE, 250933, Sem-1, CSC1102, Theory of Computing, 12.00, 4.00, A'})}
    <div class="row"><button class="btn pri" data-a="doImport">Import &amp; Update Profiles</button><button class="btn" data-a="closeModal">Cancel</button></div>
  `,{wide:true});
};
document.addEventListener('change',e=>{
  const t=e.target;
  if(t&&t.id==='impfile'&&t.files&&t.files[0]){
    const r=new FileReader();
    r.onload=()=>{F['imp.text']=String(r.result||'');renderModal();toast('File read. Check the rows, then choose Import.')};
    r.readAsText(t.files[0]);
  }
  if(t&&t.id==='mgcoursefile'&&t.files&&t.files[0]){
    const r=new FileReader();
    r.onload=()=>{F['mg.paste']=String(r.result||'');renderModal();toast('Course file loaded! Click "Parse & Load Courses" to apply.')};
    r.readAsText(t.files[0]);
  }
});
actions.doImport=()=>{
  const rawLines=fv('imp.text').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let n=0, updatedUsers=0, courseCount=0;
  const courseBuckets={};

  rawLines.forEach(line=>{
    const c=line.split(',').map(x=>x.trim());
    if(!c.length||/^school\s*id$/i.test(c[0]))return;

    // Check if this is a COURSE row: "COURSE, 250933, Sem-1, CSC1101, Title, 12.00, 2.90, B-"
    if(/^course$/i.test(c[0])&&c.length>=6){
      const sid=c[1],semLbl=c[2]||'Sem-1',code=(c[3]||'').toUpperCase(),name=c[4]||'Course';
      const cr=parseFloat(c[5])||12.00;
      let wt=parseFloat(c[6]);
      let gr=(c[7]||'B').toUpperCase();
      if(isNaN(wt))wt=AU_WEIGHTS[gr]!==undefined?AU_WEIGHTS[gr]:3.0;
      if(!courseBuckets[sid])courseBuckets[sid]={};
      if(!courseBuckets[sid][semLbl])courseBuckets[sid][semLbl]=[];
      courseBuckets[sid][semLbl].push({code,name,credits:cr,weight:wt,grade:gr});
      courseCount++;
      return;
    }

    if(c.length<3||!/^\S+@\S+\.\S+$/.test(c[2]))return;
    const sid=c[0], name=c[1], email=c[2], year=Number(c[3])||1, prog=c[4]||'';
    const overall=(c[5]&&!isNaN(parseFloat(c[5])))?Math.round(parseFloat(c[5])*100)/100:null;
    let gpas=[];
    if(c[6]){
      gpas=c[6].split(/[;\s]+/).map(x=>parseFloat(x.trim())).filter(x=>!isNaN(x));
    }
    S.registry=S.registry.filter(r=>r.schoolId!==sid);
    S.registry.push({schoolId:sid,name,email,year,programme:prog,overall,gpas});

    const existing=S.users.find(u=>u.schoolId===sid||(u.email&&u.email.toLowerCase()===email.toLowerCase()));
    if(existing){
      if(name)existing.name=name;
      if(year)existing.year=year;
      if(prog)existing.programme=prog;
      if(overall!==null)existing.overall=overall;
      if(gpas.length>0)existing.gpas=gpas;
      updatedUsers++;
    }
    n++;
  });

  // Apply imported course buckets to matching students and transcript map
  Object.keys(courseBuckets).forEach(sid=>{
    const map=getTranscriptMap();
    const stu=S.users.find(u=>u.schoolId===sid);
    const baseTr=(stu&&getStudentTranscript(stu))||map[sid]||{dob:'-',sex:'-',nationality:'-',specialisation:'-',admissionYear:'AUG25',completionYear:'-',semesters:[]};
    const sems=Array.isArray(baseTr.semesters)?clone(baseTr.semesters):[];
    Object.entries(courseBuckets[sid]).forEach(([semLbl,cList])=>{
      const idx=sems.findIndex(x=>x.label.toLowerCase()===semLbl.toLowerCase());
      if(idx>=0)sems[idx].courses=cList;
      else sems.push({label:semLbl,courses:cList});
    });
    baseTr.semesters=sems;
    map[sid]=baseTr;
    if(stu){
      syncTranscriptToStudent(stu,baseTr);
      updatedUsers++;
    }
  });

  if(!n&&!courseCount){ui.err['imp.text']='No valid student or course rows found. Check the format above.';renderModal();return;}
  ui.err={};
  addLog(`${n} student records and ${courseCount} courses imported`);
  save();
  if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
  closeModal();
  render();
  toast(`Imported ${plural(n,'student record')} and ${plural(courseCount,'course')}.`);
};

/* ---------- Admin Manage Grades, Courses & Official Transcript ---------- */
function initManageGradesDraft(s){
  const existing=getStudentTranscript(s);
  const semN=Math.max(1,semCount(s));
  const semesters=[];
  for(let i=0;i<semN;i++){
    const lbl=(existing&&existing.semesters&&existing.semesters[i]&&existing.semesters[i].label)||(`Sem-${i+1}`);
    semesters.push({label:lbl,courses:clone(courses(s,i))});
  }
  return {
    dob:(existing&&existing.dob)||(s.schoolId==='250933'?'09/04/2003':'-'),
    sex:(existing&&existing.sex)||'-',
    nationality:(existing&&existing.nationality)||'-',
    specialisation:(existing&&existing.specialisation)||'-',
    admissionYear:(existing&&existing.admissionYear)||('AUG'+String(26-(Number(s.year)||1)).padStart(2,'0')),
    completionYear:(existing&&existing.completionYear)||'-',
    refNo:(existing&&existing.refNo)||(`TRN-2026-${String(s.schoolId||'000589').replace(/\D/g,'').slice(-6).padStart(6,'0')}`),
    semesters
  };
}

function calcDraftStats(tr){
  const sems=(tr&&tr.semesters)||[];
  let totCr=0,totWt=0;
  const semStatsList=sems.map(sem=>{
    const cr=(sem.courses||[]).reduce((a,c)=>a+(Number(c.credits)||0),0);
    const wt=(sem.courses||[]).reduce((a,c)=>a+(Number(c.credits)||0)*(Number(c.weight)||0),0);
    const gpa=cr>0?Math.round((wt/cr)*100)/100:0;
    totCr+=cr;
    totWt+=wt;
    return {credits:cr,weighted:wt,gpa};
  });
  const cgpa=totCr>0?Math.round((totWt/totCr)*100)/100:0;
  return {semStatsList,totCr,totWt,cgpa};
}

function renderManageGradesModal(){
  const s=user(F['mg.id']);
  if(!s)return '';
  const tr=F['mg.tr'];
  const semIdx=Math.min(Math.max(0,Number(F['mg.semIdx']||0)),Math.max(0,tr.semesters.length-1));
  F['mg.semIdx']=semIdx;
  const curSem=tr.semesters[semIdx]||{label:'Sem-1',courses:[]};
  const stats=calcDraftStats(tr);
  const curSt=stats.semStatsList[semIdx]||{credits:0,weighted:0,gpa:0};

  return `
    <p class="muted small mb">Upload semester courses, credit hours, weights, and grades for <b>${esc(s.name)}</b> (Reg No: <b>${esc(s.schoolId||'N/A')}</b>). GPA and Cumulative GPA (CGPA) are calculated automatically and populate the student's downloadable transcript.</p>
    <form data-submit="saveGrades" novalidate>
      <div class="card tint mb" style="padding:14px">
        <div class="row between mb">
          <h4 style="margin:0">1. Transcript Header &amp; Registration Details</h4>
          <button type="button" class="btn sm" data-a="mgPreviewTranscript">📄 Preview Transcript</button>
        </div>
        <div class="grid g3" style="gap:10px">
          ${fld('mg.prog',{label:'Degree Program',ph:'Bachelor of Science Honours in Software Engineering'})}
          ${fld('mg.dob',{label:'Date of Birth',ph:'09/04/2003'})}
          ${fld('mg.adm',{label:'Year of Admission',ph:'AUG25'})}
          ${fld('mg.sex',{label:'Sex',ph:'- or M / F'})}
          ${fld('mg.nat',{label:'Nationality',ph:'- or Zimbabwean'})}
          ${fld('mg.spec',{label:'Area of Specialisation',ph:'-'})}
        </div>
      </div>

      <div class="card tint mb" style="padding:14px">
        <div class="row between mb">
          <div>
            <h4 style="margin:0">2. Quick Upload / Paste Semester Courses</h4>
            <div class="muted small">Paste lines copied directly from an Africa University Transcript PDF or upload a CSV file.</div>
          </div>
          <button type="button" class="btn sm" data-a="mgLoadSample">📋 Load AU Sample (Sem-1 · 3.52 GPA)</button>
        </div>
        <div class="field mb"><input type="file" accept=".csv,text/csv,text/plain" id="mgcoursefile" aria-label="Upload course CSV or text file"></div>
        ${fld('mg.paste',{label:'Paste Transcript Course Lines or CSV',ta:true,rows:4,ph:'Sem-1\nCSC1101 Principles of Programming Languages 12.00 2.90 B-\nCSC1102 Theory of Computing 12.00 4.00 A\nCSC1103 Calculus 12.00 4.00 A\nHUM1102 French for Beginners I 12.00 3.20 B\nSOE1101 Object Oriented Software Development 12.00 3.50 B+'})}
        <div class="row">
          <button type="button" class="btn sm pri" data-a="mgParseCourses">⚡ Parse &amp; Load into Semester Table</button>
        </div>
      </div>

      <div class="card mb" style="padding:14px">
        <div class="row between mb">
          <h4 style="margin:0">3. Semester Courses &amp; Grades (${esc(curSem.label)})</h4>
          <div class="row" style="gap:6px">
            <button type="button" class="btn sm" data-a="mgAddSem">+ Add Semester (Sem-${tr.semesters.length+1})</button>
            ${tr.semesters.length>1?`<button type="button" class="btn sm danger" data-a="mgRmSem">Remove ${esc(curSem.label)}</button>`:''}
          </div>
        </div>
        <div class="tabs mb">
          ${tr.semesters.map((sem,idx)=>`<button type="button" data-a="mgSelectSem" data-idx="${idx}" aria-pressed="${idx===semIdx}">${esc(sem.label)} (${sem.courses.length} courses · GPA ${fmt2((stats.semStatsList[idx]||{}).gpa||0)})</button>`).join('')}
        </div>

        <div class="tw">
          <table>
            <thead>
              <tr>
                <th style="width:18%">COURSE CODE</th>
                <th style="width:38%">COURSE TITLE</th>
                <th class="c" style="width:14%">Credit Hours</th>
                <th class="c" style="width:14%">Grade Awarded</th>
                <th class="c" style="width:11%">Weight</th>
                <th class="c" style="width:5%"></th>
              </tr>
            </thead>
            <tbody>
              ${curSem.courses.map((c,cIdx)=>`
              <tr>
                <td><input type="text" value="${esc(c.code)}" data-mgc="code" data-ci="${cIdx}" placeholder="CSC1101" style="padding:6px 8px;font-weight:600"></td>
                <td><input type="text" value="${esc(c.name)}" data-mgc="name" data-ci="${cIdx}" placeholder="Course Title" style="padding:6px 8px"></td>
                <td class="c"><input type="number" step="0.5" value="${esc(c.credits)}" data-mgc="credits" data-ci="${cIdx}" style="padding:6px 8px;text-align:right"></td>
                <td class="c">
                  <select data-mgc="grade" data-ci="${cIdx}" style="padding:6px 8px">
                    ${AU_GRADE_LIST.map(g=>`<option value="${g}" ${String(c.grade).toUpperCase()===g?'selected':''}>${g} (${fmt2(AU_WEIGHTS[g])})</option>`).join('')}
                  </select>
                </td>
                <td class="c"><input type="number" step="0.01" value="${esc(c.weight)}" data-mgc="weight" data-ci="${cIdx}" style="padding:6px 8px;text-align:right"></td>
                <td class="c"><button type="button" class="btn sm danger" data-a="mgRmCourse" data-ci="${cIdx}" title="Remove course">✕</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="row between mt" style="margin-top:12px">
          <button type="button" class="btn sm" data-a="mgAddCourse">+ Add Course to ${esc(curSem.label)}</button>
          <div id="mg-live-summary" class="row" style="gap:16px;font-size:.9rem">
            <span><b>${esc(curSem.label)} Credit Hours:</b> ${fmt2(curSt.credits)}</span>
            <span><b>Weighted Points:</b> ${fmt2(curSt.weighted)}</span>
            <span><b>${esc(curSem.label)} GPA:</b> <strong style="color:var(--ok)">${fmt2(curSt.gpa)}</strong></span>
            <span><b>Cumulative GPA (CGPA):</b> <strong style="color:var(--ok);font-size:1.05rem">${fmt2(stats.cgpa)}</strong></span>
          </div>
        </div>
      </div>

      <div class="row between mt">
        <div class="muted small">Saving immediately updates the student's grades, CGPA, and official downloadable transcript.</div>
        <div class="row">
          <button class="btn pri" type="submit">💾 Save Courses &amp; Results</button>
          <button type="button" class="btn" data-a="closeModal">Cancel</button>
        </div>
      </div>
    </form>
  `;
}

function updateMgLiveSummary(){
  const tr=F['mg.tr'];
  if(!tr)return;
  const semIdx=Number(F['mg.semIdx']||0);
  const curSem=tr.semesters[semIdx]||{label:'Sem-1',courses:[]};
  const stats=calcDraftStats(tr);
  const curSt=stats.semStatsList[semIdx]||{credits:0,weighted:0,gpa:0};
  const el=document.getElementById('mg-live-summary');
  if(el){
    el.innerHTML=`
      <span><b>${esc(curSem.label)} Credit Hours:</b> ${fmt2(curSt.credits)}</span>
      <span><b>Weighted Points:</b> ${fmt2(curSt.weighted)}</span>
      <span><b>${esc(curSem.label)} GPA:</b> <strong style="color:var(--ok)">${fmt2(curSt.gpa)}</strong></span>
      <span><b>Cumulative GPA (CGPA):</b> <strong style="color:var(--ok);font-size:1.05rem">${fmt2(stats.cgpa)}</strong></span>`;
  }
}

document.addEventListener('input',e=>{
  const t=e.target;
  if(!t||!t.dataset||!t.dataset.mgc)return;
  const tr=F['mg.tr'];
  if(!tr)return;
  const semIdx=Number(F['mg.semIdx']||0);
  const cIdx=Number(t.dataset.ci);
  const sem=tr.semesters[semIdx];
  if(!sem||!sem.courses[cIdx])return;
  const field=t.dataset.mgc;
  if(field==='credits')sem.courses[cIdx].credits=parseFloat(t.value)||0;
  else if(field==='weight')sem.courses[cIdx].weight=parseFloat(t.value)||0;
  else if(field==='grade'){
    const g=t.value.toUpperCase();
    sem.courses[cIdx].grade=g;
    if(AU_WEIGHTS[g]!==undefined){
      sem.courses[cIdx].weight=AU_WEIGHTS[g];
      const wInput=t.closest('tr')&&t.closest('tr').querySelector('input[data-mgc="weight"]');
      if(wInput)wInput.value=AU_WEIGHTS[g];
    }
  } else {
    sem.courses[cIdx][field]=t.value;
  }
  updateMgLiveSummary();
});

actions.manageGrades=el=>{
  const s=user(el.dataset.id);
  if(!s)return;
  F['mg.id']=s.id;
  const tr=initManageGradesDraft(s);
  F['mg.tr']=tr;
  F['mg.semIdx']=0;
  F['mg.prog']=fullProgramName(s.programme);
  F['mg.dob']=tr.dob;
  F['mg.adm']=tr.admissionYear;
  F['mg.sex']=tr.sex;
  F['mg.nat']=tr.nationality;
  F['mg.spec']=tr.specialisation;
  F['mg.paste']='';
  ui.err={};
  openModal(`Manage Courses & Transcript: ${s.name}`,renderManageGradesModal,{wide:true});
};
actions.mgSelectSem=el=>{
  F['mg.semIdx']=Number(el.dataset.idx)||0;
  renderModal();
};
actions.mgAddSem=()=>{
  const tr=F['mg.tr'];
  if(!tr)return;
  const nextNum=tr.semesters.length+1;
  const catCourses=(CAT[nextNum-1]||CAT[0]).map(c=>({code:c[1],name:c[0],credits:12.00,weight:3.50,grade:'B+'}));
  tr.semesters.push({label:`Sem-${nextNum}`,courses:catCourses});
  F['mg.semIdx']=tr.semesters.length-1;
  renderModal();
};
actions.mgRmSem=()=>{
  const tr=F['mg.tr'];
  if(!tr||tr.semesters.length<=1)return;
  const idx=Number(F['mg.semIdx']||0);
  tr.semesters.splice(idx,1);
  F['mg.semIdx']=Math.max(0,idx-1);
  renderModal();
};
actions.mgAddCourse=()=>{
  const tr=F['mg.tr'];
  if(!tr)return;
  const sem=tr.semesters[Number(F['mg.semIdx']||0)];
  if(!sem)return;
  sem.courses.push({code:'',name:'',credits:12.00,weight:4.00,grade:'A'});
  renderModal();
};
actions.mgRmCourse=el=>{
  const tr=F['mg.tr'];
  if(!tr)return;
  const sem=tr.semesters[Number(F['mg.semIdx']||0)];
  if(!sem)return;
  sem.courses.splice(Number(el.dataset.ci),1);
  renderModal();
};
actions.mgLoadSample=()=>{
  const tr=F['mg.tr'];
  if(!tr)return;
  const semIdx=Number(F['mg.semIdx']||0);
  tr.semesters[semIdx]={label:`Sem-${semIdx+1}`,courses:clone(SAMPLE_AU_SEM1)};
  if(F['mg.dob']==='-')F['mg.dob']='09/04/2003';
  if(!F['mg.adm']||F['mg.adm']==='-')F['mg.adm']='AUG25';
  F['mg.prog']='Bachelor of Science Honours in Software Engineering';
  renderModal();
  toast('Loaded Africa University Sem-1 sample courses (GPA 3.52)!');
};
actions.mgParseCourses=()=>{
  const raw=fv('mg.paste').trim();
  if(!raw){toast('Paste transcript lines or upload a CSV file first.','bad');return;}
  const tr=F['mg.tr'];
  const res=parseTranscriptCoursesText(raw,tr.semesters);
  if(!res.added){
    toast('Could not find valid course lines. Use format: CSC1101 Principles of Programming Languages 12.00 2.90 B-','bad');
    return;
  }
  tr.semesters=res.sems;
  F['mg.paste']='';
  renderModal();
  toast(`✓ Parsed and loaded ${plural(res.added,'course')} across ${plural(tr.semesters.length,'semester')}!`);
};
actions.mgPreviewTranscript=()=>{
  const s=user(fv('mg.id'));
  if(!s)return;
  const tr=F['mg.tr'];
  tr.dob=fv('mg.dob','-').trim()||'-';
  tr.admissionYear=fv('mg.adm','AUG25').trim()||'AUG25';
  tr.sex=fv('mg.sex','-').trim()||'-';
  tr.nationality=fv('mg.nat','-').trim()||'-';
  tr.specialisation=fv('mg.spec','-').trim()||'-';
  if(fv('mg.prog').trim())s.programme=fv('mg.prog').trim();
  syncTranscriptToStudent(s,tr);
  save();
  if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
  actions.transcript({dataset:{id:s.id,kind:'unofficial'}});
};
submits.saveGrades=()=>{
  const sid=fv('mg.id'), s=user(sid);
  if(!s)return fail();
  const tr=F['mg.tr'];
  if(!tr)return fail();
  tr.dob=fv('mg.dob','-').trim()||'-';
  tr.admissionYear=fv('mg.adm','AUG25').trim()||'AUG25';
  tr.sex=fv('mg.sex','-').trim()||'-';
  tr.nationality=fv('mg.nat','-').trim()||'-';
  tr.specialisation=fv('mg.spec','-').trim()||'-';
  if(fv('mg.prog').trim())s.programme=fv('mg.prog').trim();

  // Filter out completely blank rows
  tr.semesters.forEach(sem=>{
    sem.courses=(sem.courses||[]).filter(c=>(c.code||'').trim()||(c.name||'').trim());
  });
  syncTranscriptToStudent(s,tr);
  addLog(`Academic transcript and courses updated for ${s.name} (CGPA ${s.overall!=null?fmt2(s.overall):'N/A'})`);
  save();
  if(AU_CONFIG.USE_BACKEND && AuAPI.flush) AuAPI.flush();
  closeModal();
  render();
  toast(`Courses & transcript saved for ${s.name}. CGPA: ${s.overall!=null?fmt2(s.overall):'Not set'}.`);
};

/* permissions */
function permsPage(u){
  if(!ui.pd)ui.pd=clone(S.perms);
  const diffs=[];PROWS.forEach(r=>{if(!r.k)return;PROLES.forEach(role=>{const a=S.perms[r.k][role],b=ui.pd[r.k][role];if(a&&b&&a.v!==b.v)diffs.push([r,role,b.v])})});
  return `${crumbs([['Home','/admin'],['Permissions']])}<div class="pagehead"><div><h1>Permissions</h1><p class="sub">Choose what each role can do. Changes apply the next time people sign in.</p></div></div>
  ${diffs.length?`<div class="banner mb" role="status">▲ You have ${plural(diffs.length,'unsaved change')}. <button class="linkbtn" data-a="undoPerms" style="color:inherit">Undo changes</button></div>`:''}
  <div class="card"><div class="tw"><table class="perm"><thead><tr><th>What people can do</th>${PROLES.map(r=>`<th class="c">${PLABEL[r]}</th>`).join('')}</tr></thead><tbody>
  ${PROWS.map(r=>r.g?`<tr class="grp"><td colspan="6">${r.g}</td></tr>`:`<tr><td>${r.l}</td>${PROLES.map(role=>{const c=ui.pd[r.k][role];if(!c)return '<td class="c muted">–</td>';const ch=S.perms[r.k][role].v!==c.v;return `<td class="c">${c.lock?`<button class="lock ${c.v?'yes':'no'}" data-a="lockWhy" data-k="${r.k}" aria-label="${PLABEL[role]}: ${c.v?'allowed':'not allowed'}, fixed by the school. Tap to see why.">🔒 ${c.v?'✓':'✕'}</button>`:`<button class="${c.v?'yes':'no'}" data-a="togPerm" data-k="${r.k}" data-role="${role}" aria-pressed="${c.v}" aria-label="${PLABEL[role]}: ${esc(r.l)}: ${c.v?'allowed':'not allowed'}" ${ch?'style="outline:2px solid var(--role)"':''}>${c.v?'✓':'✕'}</button>`}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="hint mt">🔒 A lock means the school's rules fix this setting. Tap the lock to see why.</p><div class="row mt"><button class="btn pri" data-a="savePerms" ${diffs.length?'':'disabled'}>Save changes</button></div></div>
  <div class="card mt"><h3>Recent changes</h3><p class="hint mb">Every change is recorded: who made it and when.</p><div class="list">${S.permLog.slice(0,6).map(l=>`<div class="item"><span>${esc(l.text)} <span class="muted">· by ${esc(l.by)}</span></span><span class="muted small">${fmtWhen(l.ts)}</span></div>`).join('')}</div></div>
  <div class="card tint mt"><h3>Fixed by the school</h3><ul style="margin:0;padding-left:20px"><li>Nobody can edit certified GPA or grades here.</li><li>Students cannot verify their own entries.</li><li>Administrators always keep access to accounts and permissions.</li><li>Supervisors only see the students linked to them.</li></ul></div>`}
actions.togPerm=el=>{const c=ui.pd[el.dataset.k][el.dataset.role];c.v=!c.v;render()};
actions.undoPerms=()=>{ui.pd=clone(S.perms);render()};
actions.lockWhy=el=>{const r=PROWS.find(x=>x.k===el.dataset.k);openModal('Why is this locked?',()=>`<p><b>${esc(r.l)}</b></p><p class="mt">${esc(r.why||'The school\'s rules fix this setting, so it can\'t be changed here.')}</p><div class="row mt"><button class="btn pri" data-a="closeModal">Got it</button></div>`)};
actions.savePerms=()=>{if(!need('change_perms'))return;const u=me(),roles=new Set(),msgs=[];PROWS.forEach(r=>{if(!r.k)return;PROLES.forEach(role=>{const a=S.perms[r.k][role],b=ui.pd[r.k][role];if(a&&b&&a.v!==b.v){roles.add(PLABEL[role]+'s');msgs.push(`${PLABEL[role]}s ${b.v?'can now':'can no longer'} ${r.l.charAt(0).toLowerCase()+r.l.slice(1)}`)}})});
  if(!msgs.length)return;S.perms=clone(ui.pd);msgs.forEach(m=>S.permLog.unshift({ts:Date.now(),by:u.name,text:m}));addLog('Permissions changed for '+[...roles].join(', '));save();render();toast('Permissions saved. They apply the next time people sign in.')};

/* reports */
const REP_TYPES=[['progress','Student progress','How students are doing across grades and credits.'],['complete','Portfolio completeness','Who has projects, achievements, leadership and activities filled in.'],['compliance','Compliance checks','Entries waiting too long and letters past their due date.'],['attach','Attachment progress','Where each student is on attachment, and the latest supervisor note.']];
const repSpec=f=>({type:f['rep.type']||'progress',group:f['rep.group']||'all',period:f['rep.period']||'cur',grades:f['rep.grades']!==undefined?f['rep.grades']:true,credits:f['rep.credits']!==undefined?f['rep.credits']:true,acts:f['rep.acts']!==undefined?f['rep.acts']:true,comp:f['rep.comp']!==undefined?f['rep.comp']:true});
const groupLabel=g=>g==='all'?'All years':'Year '+g;
function repData(sp){
  let st=students();if(sp.group!=='all')st=st.filter(s=>String(s.year)===String(sp.group));
  const waitOld=s=>myActs(s.id).filter(a=>a.status!=='verified'&&Date.now()-a.created>OLD).length,late=s=>S.letters.filter(l=>l.sid===s.id&&openLetters(l)&&l.due<Date.now()).length;
  let cols=['Student','School ID','Year'],rows;
  if(sp.type==='progress'){if(sp.grades)cols.push('Overall GPA','Latest semester GPA');if(sp.credits)cols.push('Credits earned');if(sp.acts)cols.push('Activities','Verified');if(sp.comp)cols.push('Entries waiting 30+ days','Letters past due');
    rows=st.map(s=>{const a=myActs(s.id),r=[s.name,s.schoolId,s.year];if(sp.grades)r.push(s.overall==null?'–':fmt2(s.overall),s.gpas.length?fmt2(semGpa(s,s.gpas.length-1)):'–');if(sp.credits)r.push(creditsDone(s)+' of 120');if(sp.acts)r.push(a.length,a.filter(x=>x.status==='verified').length);if(sp.comp)r.push(waitOld(s),late(s));return r})}
  else if(sp.type==='complete'){cols.push('Projects','Achievements','Leadership','Extracurricular','Complete');rows=st.map(s=>{const a=myActs(s.id),c=t=>a.filter(x=>x.type===t).length;return [s.name,s.schoolId,s.year,myProjects(s.id).length,c('achievement'),c('leadership'),c('extra'),isComplete(s.id)?'Yes':'No']})}
  else if(sp.type==='compliance'){cols.push('Unverified entries','Waiting 30+ days','Letters past due');rows=st.map(s=>[s.name,s.schoolId,s.year,myActs(s.id).filter(a=>a.status!=='verified').length,waitOld(s),late(s)])}
  else{cols=['Student','School ID','Supervisor','Company','Week','Latest note'];rows=st.filter(s=>s.attach).map(s=>{const n=S.notes.filter(x=>x.sid===s.id).sort((a,b)=>b.wk-a.wk)[0],sup=user(s.attach.supId);return [s.name,s.schoolId,sup?sup.name:'–',s.attach.company,`${attWeek(s.attach)} of ${attWeeks(s.attach)}`,n?`Week ${n.wk}: ${n.text}`:'No notes yet']})}
  const gp=st.filter(s=>s.overall!=null);
  return {cols,rows,stats:{n:st.length,gpa:gp.length?gp.reduce((a,s)=>a+s.overall,0)/gp.length:null,cr:st.length?Math.round(st.reduce((a,s)=>a+creditsDone(s),0)/st.length):0,old:st.reduce((a,s)=>a+waitOld(s),0)}}}
const repTable=(d,lim)=>`<div class="tw"><table><thead><tr>${d.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${d.rows.slice(0,lim||999).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${d.cols.length}" class="muted">No students match these choices.</td></tr>`}</tbody></table></div>`;
const csvOf=d=>[d.cols,...d.rows].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
function reportsPage(u){
  const sp=repSpec(F),t=REP_TYPES.find(x=>x[0]===sp.type),d=repData(sp),fmtSel=fv('rep.fmt','PDF');
  return `${crumbs([['Home','/admin'],['Reports']])}<div class="pagehead"><div><h1>Reports</h1><p class="sub">Build a report, check the preview, then export it.</p></div></div>
  <div class="grid g2"><div class="card"><h3>Build your report</h3>
   ${selF('rep.type',REP_TYPES.map(x=>[x[0],x[1]]),{label:'What kind of report?',r:1,hint:t[2]})}
   ${selF('rep.group',[['all','All years'],...[1,2,3,4].map(y=>[String(y),'Year '+y])],{label:'Which students?',r:1})}
   ${selF('rep.period',[['cur',`This academic year (${CUR_YEAR})`],['prev',`Last academic year (${PREV_YEAR})`]],{label:'Which period?',r:1,hint:sp.period==='prev'?`Earlier years aren't loaded in this prototype, so the figures below are today's records.`:''})}
   ${sp.type==='progress'?`<div class="field ${ui.err['rep.inc']?'has-err':''}"><label>What should it include?</label>${chk('rep.grades','Grades and GPA',sp.grades,1)}${chk('rep.credits','Credits earned',sp.credits,1)}${chk('rep.acts','Activities and achievements',sp.acts,1)}${chk('rep.comp','Compliance checks',sp.comp,1)}${ui.err['rep.inc']?`<div class="errmsg">${esc(ui.err['rep.inc'])}</div>`:''}</div>`:`<p class="hint mb">This report has a fixed layout.</p>`}
   <div class="field"><label>Save it as</label><div class="tabs">${['PDF','Excel','CSV'].map(f=>`<button data-a="setF" data-k="rep.fmt" data-v="${f}" aria-pressed="${fmtSel===f}">${f}</button>`).join('')}</div></div>
   <button class="btn pri" data-a="exportReport">Export report</button><p class="hint mt">Reports contain student records. Only share them with people who are allowed to see them.</p></div>
  <div class="card"><h3>Preview</h3><p class="hint mb">Live figures from today's records.</p><h4>${esc(t[1])}</h4><p class="muted mb">${groupLabel(sp.group)} · This academic year (${CUR_YEAR})</p>
   <div class="list"><div class="item"><span>Students included</span><b>${d.stats.n}</b></div><div class="item"><span>Average overall GPA</span><b>${d.stats.gpa==null?'–':d.stats.gpa.toFixed(2)}</b></div><div class="item"><span>Average credits earned</span><b>${d.stats.cr} of 120</b></div><div class="item"><span>Entries waiting over 30 days</span><b>${d.stats.old}</b></div></div>
   <div class="mt">${repTable(d,4)}${d.rows.length>4?`<p class="hint mt">and ${d.rows.length-4} more in the export.</p>`:''}</div></div></div>
  <div class="card mt"><h3>Recent reports</h3>${S.reports.length?`<div class="list">${S.reports.slice(0,5).map(r=>`<div class="item"><div class="row"><span class="chip info">${r.fmt==='Excel'?'XLS':r.fmt}</span><div><b>${esc(r.name)}</b><div class="muted small">${fmtD(r.ts)} · ${r.fmt}</div></div></div><button class="btn sm" data-a="reopenReport" data-id="${r.id}">Download again</button></div>`).join('')}</div>`:'<div class="empty">No reports yet. Build one above and export it.</div>'}</div>`}
function reportModal(r){const sp=repSpec(r.f),d=repData(sp);
  openModal(r.name,()=>`<p class="muted mb">${r.fmt==='PDF'?'Use "Print or save as PDF" to keep this report.':`In the live system this downloads as ${r.fmt==='Excel'?'an Excel file':'a CSV file'}. Here, copy the CSV below and paste it into ${r.fmt==='Excel'?'Excel':'a text file'}.`}</p><div class="doc"><h2>${esc(r.name)}</h2><div class="dm">${esc(SCHOOL)} · ${groupLabel(sp.group)} · generated ${fmtDL(r.ts)}</div><div class="mt">${repTable(d)}</div></div>
  <div class="field mt noprint"><label for="csvbox">CSV</label><textarea id="csvbox" rows="4" readonly>${esc(csvOf(d))}</textarea></div><div class="row noprint"><button class="btn pri" data-a="print">Print or save as PDF</button><button class="btn" data-a="copy" data-t="csvbox">Copy CSV</button><button class="btn" data-a="closeModal">Close</button></div>`,{wide:true})}
actions.exportReport=()=>{const sp=repSpec(F);ui.err={};if(sp.type==='progress'&&!(sp.grades||sp.credits||sp.acts||sp.comp)){ui.err['rep.inc']='Tick at least one thing to include, or the report would be empty.';return fail()}
  const name=`${REP_TYPES.find(x=>x[0]===sp.type)[1]} (${groupLabel(sp.group).toLowerCase()})`;const r={id:uid('r'),name,fmt:fv('rep.fmt','PDF'),ts:Date.now(),f:{'rep.type':sp.type,'rep.group':sp.group,'rep.grades':sp.grades,'rep.credits':sp.credits,'rep.acts':sp.acts,'rep.comp':sp.comp}};
  S.reports.unshift(r);save();render();reportModal(r)};
actions.reopenReport=el=>{const r=S.reports.find(x=>x.id===el.dataset.id);if(r)reportModal(r)};

/* ======================= ROUTING ======================= */
function notFound(){return `<div class="empty">We couldn't find that page. Use the menu to get back on track.</div>`}
function pageFor(u,p){
  if(p[0]==='opportunities')return opportunitiesPage(u);
  const r=u.role;
  if(r==='student'){if(!p.length)return studentHome(u);
    if(p[0]==='grades')return gradesPage(u);
    if(p[0]==='projects')return p[1]==='new'?projectForm(u):p[1]==='edit'?projectForm(u,p[2]):projectsPage(u);
    if(p[0]==='activities')return activitiesPage(u);if(p[0]==='letters')return lettersPage(u)}
  else if(r==='staff'){if(!p.length)return staffHome(u);
    if(p[0]==='students')return p[1]?reviewPage(u,p[1]):staffStudents(u);
    if(p[0]==='letters')return p[1]==='write'?letterEditor(u,p[2]):p[1]==='update'?letterUpdater(u,p[2]):staffLetters(u)}
  else if(r==='supervisor'){if(!p.length)return supHome(u);if(p[0]==='students')return p[1]?supPortfolio(u,p[1]):supStudentsPage(u)}
  else if(r==='admin'){if(!p.length)return adminHome(u);
    if(p[0]==='people')return can('manage_accounts')?peoplePage(u):'<div class="empty">Your role cannot manage accounts.</div>';
    if(p[0]==='permissions')return can('change_perms')?permsPage(u):'<div class="empty">Your role cannot change permissions.</div>';
    if(p[0]==='reports')return can('see_reports')?reportsPage(u):'<div class="empty">Your role cannot see reports.</div>'}
  return notFound();
}

/* ======================= PUBLIC PROFILE & GUEST PORTAL ======================= */
function publicProfilePage(identifier){
  document.title = 'Student Portfolio · ' + SCHOOL;
  app.innerHTML = `<div class="portal-wrap"><div class="card" style="text-align:center;padding:40px 20px"><div class="brand mb" style="justify-content:center">${logo()}</div><h2 class="mb">Loading Certified Portfolio...</h2><div class="muted small">Africa University Mutare, Zimbabwe</div></div></div>`;

  if(!identifier){
    app.innerHTML = `<div class="portal-wrap"><div class="card"><div class="brand mb">${logo()}</div><h2>Portfolio Not Found</h2><p class="muted">No student identifier provided. Please check the link or contact the student.</p><div class="mt"><a class="btn pri" href="#/login">Go to Sign in</a></div></div></div>`;
    return;
  }

  const renderProfile = data => {
    const p = data.profile;
    const s = data.settings || {};
    app.innerHTML = `
      <div class="portal-wrap">
        <header class="card mb" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
          <div class="brand" style="margin:0;padding:0">${logo()}<div><b>${esc(SCHOOL)}</b><div class="muted small">Verified Student Credential &amp; Portfolio</div></div></div>
          <div class="row"><span class="chip ok">✓ Verified Student</span><a class="btn sm" href="#/login">Portal Sign In</a></div>
        </header>

        <div class="card mb">
          <div class="hello" style="margin:0">
            ${p.photo ? `<div class="avatar" style="--s:72px"><img src="${p.photo}" alt=""></div>` : avatar({name:p.name},72,false)}
            <div style="min-width:0;flex:1">
              <h1 style="font-size:clamp(1.4rem,4vw,1.85rem);margin-bottom:4px">${esc(p.name)}</h1>
              <p class="muted" style="margin-bottom:6px">${esc(p.programme)} · Year ${p.year} · ${esc(p.schoolId)}</p>
              <div class="small muted">${p.institution || 'Africa University, Mutare, Zimbabwe'}</div>
            </div>
          </div>
          ${p.bio ? `<p class="mt" style="font-size:1.03rem;line-height:1.55">${esc(p.bio)}</p>` : ''}
          ${p.skills && p.skills.length ? `<div class="tags mt">${p.skills.map(sk=>`<span class="tag">${esc(sk)}</span>`).join('')}</div>` : ''}
          ${(p.linkedin || p.github) ? `<div class="row mt" style="gap:10px">${p.linkedin?`<a class="btn sm" href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn Profile ↗</a>`:''}${p.github?`<a class="btn sm" href="${esc(p.github)}" target="_blank" rel="noopener">GitHub Portfolio ↗</a>`:''}</div>` : ''}
        </div>

        ${s.showGrades !== false && p.overall != null ? `
          <div class="card mb">
            <div class="row between"><h3>Academic Standing</h3><span class="chip ok">✓ Certified by Registry</span></div>
            <div class="grid g2 mt">
              <div class="stat"><div class="l">Cumulative GPA</div><div class="n" style="color:var(--ok)">${p.overall.toFixed(2)}</div><div class="d">4.0 Grading Scale</div></div>
              <div class="stat"><div class="l">Progress</div><div class="n">${Math.min(100, Math.round((p.year * 30)/120 * 100))}%</div><div class="d">Toward Degree Completion</div></div>
            </div>
          </div>
        ` : ''}

        ${s.showProjects !== false && p.projects && p.projects.length ? `
          <div class="card mb">
            <h3 class="mb">Selected Projects (${p.projects.length})</h3>
            <div class="stack">${p.projects.map(pj=>`
              <div class="item" style="flex-direction:column;align-items:flex-start;border-top:1px solid var(--line);padding-top:12px">
                <div class="row between" style="width:100%"><b>${esc(pj.name)}</b><span class="chip info sm">${esc(pj.kind)}</span></div>
                ${pj.goal ? `<p class="small mt" style="margin-bottom:4px"><b>Goal:</b> ${esc(pj.goal)}</p>` : ''}
                ${pj.challenge ? `<p class="small" style="margin-bottom:4px"><b>Challenge &amp; Solution:</b> ${esc(pj.challenge)}</p>` : ''}
                ${pj.result ? `<p class="small" style="margin-bottom:4px"><b>Result:</b> ${esc(pj.result)}</p>` : ''}
                ${pj.link ? `<div class="mt"><a class="btn sm" href="${esc(pj.link)}" target="_blank" rel="noopener">View Project ↗</a></div>` : ''}
              </div>
            `).join('')}</div>
          </div>
        ` : ''}

        ${s.showActs !== false && p.activities && p.activities.length ? `
          <div class="card mb">
            <h3 class="mb">Verified Leadership &amp; Activities (${p.activities.length})</h3>
            <div class="stack">${p.activities.map(a=>`
              <div class="item">
                <div>
                  <b>${esc(a.title)}</b>
                  <div class="muted small">${esc(TYPE1[a.type]||a.type)} · Year ${a.year}${a.where ? ' · ' + esc(a.where) : ''}</div>
                </div>
                <span class="chip ok">✓ Verified${a.verifiedBy ? ' by ' + esc(a.verifiedBy) : ''}</span>
              </div>
            `).join('')}</div>
          </div>
        ` : ''}

        ${s.showLetters === true && p.letters && p.letters.length ? `
          <div class="card mb">
            <h3 class="mb">Official Letters of Recommendation (${p.letters.length})</h3>
            <div class="stack">${p.letters.map(lt=>`
              <div class="card tint mb">
                <div class="row between mb">
                  <div><b>${esc(lt.purpose)}</b><div class="muted small">Certified on ${fmtD(lt.date)}</div></div>
                  <span class="chip ok">✓ Officially Certified</span>
                </div>
                <div style="white-space:pre-wrap;font-family:serif;font-size:1.05rem;line-height:1.6;margin-bottom:12px">${esc(lt.body)}</div>
                <div class="muted small" style="text-align:right">Signed: <b>${esc(lt.signedBy)}</b></div>
              </div>
            `).join('')}</div>
          </div>
        ` : ''}

        <footer class="mt" style="text-align:center;padding:16px;color:var(--muted);font-size:0.85rem">
          This record is digitally hosted by Africa University's Student Recommendation &amp; Portfolio System.
        </footer>
      </div>
    `;
  };

  if(AU_CONFIG.USE_BACKEND){
    AuAPI.getPublicProfile(identifier).then(res=>{
      if(res && res.profile) renderProfile(res);
      else app.innerHTML = `<div class="portal-wrap"><div class="card"><h2>Profile Unavailable</h2><p class="muted">This profile is private or not active.</p><a class="btn pri mt" href="#/login">Go to Login</a></div></div>`;
    }).catch(err=>{
      app.innerHTML = `<div class="portal-wrap"><div class="card"><h2>Profile Not Found</h2><p class="muted">${esc(err&&err.message||'This student has not made their profile public.')}</p><a class="btn pri mt" href="#/login">Go to Login</a></div></div>`;
    });
  } else {
    // Demo fallback: Find student in local S
    const st = S.users.find(x=>(x.shareSlug===identifier || x.schoolId===identifier || x.id===identifier) && x.role==='student');
    if(!st) {
      app.innerHTML = `<div class="portal-wrap"><div class="card"><h2>Profile Not Found</h2><p class="muted">No matching student found.</p></div></div>`;
      return;
    }
    renderProfile({
      profile: {
        name: st.name, schoolId: st.schoolId, programme: st.programme, year: st.year,
        bio: st.bio, skills: st.skills, photo: st.photo, overall: st.overall,
        projects: myProjects(st.id), activities: myActs(st.id).filter(a=>a.status==='verified')
      },
      settings: st.publicShare || { showGrades: true, showProjects: true, showActs: true, showLetters: false }
    });
  }
}

function guestPortalPage(parts){
  const sub = parts[0]; // 'letter' or 'verify'
  const token = parts[1] || '';
  document.title = (sub==='letter' ? 'Recommendation Letter' : 'Activity Verification') + ' · ' + SCHOOL;

  if(!sub || !token){
    // Access Code Entry Form
    app.innerHTML = `
      <div class="portal-wrap narrow">
        <div class="card">
          <div class="brand mb" style="justify-content:center">${logo()}</div>
          <h2 style="text-align:center" class="mb">External Access Portal</h2>
          <p class="muted mb" style="text-align:center">Enter the 6-digit access code sent to your email by the student.</p>
          <form data-submit="guestCodeAccess" novalidate>
            <div class="field"><label for="g_code">6-Digit Access Code</label><input id="g_code" data-k="g.code" style="font-size:1.4rem;text-align:center;letter-spacing:4px" maxlength="8" placeholder="123456" required></div>
            <div class="field"><label for="g_email">Your Email Address (optional confirmation)</label><input id="g_email" type="email" data-k="g.email" placeholder="recommender@example.com"></div>
            <button class="btn pri" style="width:100%" type="submit">Unlock Candidate Request</button>
          </form>
          <div class="mt" style="text-align:center"><a class="muted small" href="#/login">Have an AU staff account? Sign in here</a></div>
        </div>
      </div>
    `;
    return;
  }

  if(sub==='letter'){
    renderGuestLetterPortal(token);
  } else if(sub==='verify'){
    renderGuestVerifyPortal(token);
  }
}

submits.guestCodeAccess = f => {
  const code = (fv('g.code')||'').trim();
  const email = (fv('g.email')||'').trim();
  if(!code){ toast('Enter your 6-digit access code.','bad'); return; }
  toast('Verifying access code...');
  AuAPI.getGuestLetter(code, code, email).then(res=>{
    if(res && res.token){
      if(res.type === 'verify'){
        location.hash = '#/guest/verify/' + res.token;
      } else {
        location.hash = '#/guest/letter/' + res.token;
      }
    } else {
      toast('Invalid or expired code. Please verify and try again.','bad');
    }
  }).catch(err=>{
    toast(err&&err.message||'Invalid access code. Please check your email.','bad');
  });
};

function renderGuestLetterPortal(token){
  app.innerHTML = `<div class="portal-wrap"><div class="card" style="text-align:center;padding:40px 20px"><h2>Loading Candidate Information...</h2></div></div>`;
  AuAPI.getGuestLetter(token).then(res=>{
    const st = res.student;
    const l = res.letter;
    const projs = res.projects || [];
    const acts = res.activities || [];
    const draft = fv('g.letterBody', l.draft || `To whom it may concern,\n\nI am pleased to write this recommendation for ${st.name}, who is studying ${st.programme} at Africa University.\n\n[Add details of candidate's strengths and character]\n\nSincerely,\n${res.guestName}`);

    app.innerHTML = `
      <div class="portal-wrap">
        <header class="card mb" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div class="brand" style="margin:0;padding:0">${logo()}<div><b>${esc(SCHOOL)}</b><div class="muted small">Guest Recommender Portal</div></div></div>
          <span class="chip ok">✓ Verified Access Token</span>
        </header>

        <div class="banner info mb">
          <b>Welcome, ${esc(res.guestName)}</b><br>
          ${esc(st.name)} has requested a recommendation letter for <b>${esc(l.purpose)}</b> (needed by ${fmtD(l.due)}).
          ${l.note ? `<br><br><b>Student's Personal Note:</b> “${esc(l.note)}”` : ''}
        </div>

        <div class="grid g21">
          <div class="card letter-edit">
            <h3>Write &amp; Certify Recommendation Letter</h3>
            <div class="field">
              <div class="row between mb">
                <label for="g_body">Letter Body</label>
                <button type="button" class="btn sm pri" data-a="guestAiDraft" data-token="${token}">✨ AI Draft with Gemini</button>
              </div>
              <textarea id="g_body" data-k="g.letterBody" rows="16" style="font-family:Georgia,'Times New Roman',serif;font-size:1.02rem;line-height:1.55">${esc(draft)}</textarea>
              <div class="hint">Use Gemini AI to quickly generate a formal, well-structured reference based on ${esc(first(st.name))}'s verified achievements.</div>
            </div>
            <div class="field">
              <label for="g_signer">Your Full Name &amp; Title (Official Signature)</label>
              <input id="g_signer" data-k="g.signer" value="${esc(fv('g.signer', res.guestName))}">
            </div>
            <div class="row mt">
              <button class="btn pri" data-a="guestSubmitLetter" data-token="${token}">✓ Sign &amp; Submit Official Letter</button>
              <button class="btn" data-a="guestSaveDraft" data-token="${token}">Save Draft</button>
              <button class="btn danger" data-a="guestDeclineLetter" data-token="${token}">Decline</button>
            </div>
          </div>

          <div class="stack">
            ${(l.attachments && l.attachments.length) ? `
              <div class="card" style="border:2px solid #c49a45">
                <h4 style="margin:0 0 6px 0;display:flex;align-items:center;gap:6px">
                  <span>📎 Attached Documents (${l.attachments.length})</span>
                </h4>
                <p class="muted small" style="margin:0 0 10px 0">Uploaded directly by ${esc(st.name)} (CV, transcripts, or portfolio files):</p>
                <div class="stack" style="gap:8px">
                  ${l.attachments.map(att => `
                    <div class="att-row">
                      <div style="min-width:0;flex:1">
                        <div style="font-weight:bold;font-size:0.9rem;overflow-wrap:anywhere">📄 ${esc(att.name)}</div>
                        <div class="muted small">${att.size ? (Math.round(att.size/1024) + ' KB') : ''}</div>
                      </div>
                      <a class="btn sm pri" style="flex:none;text-decoration:none" href="${att.data}" download="${esc(att.name)}" target="_blank">Download ⬇</a>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="card">
              <h3>${esc(first(st.name))}'s Shared Record</h3>
              <p class="muted small">${esc(st.programme)} · Year ${st.year}</p>
              ${st.overall != null ? `<div class="stat mt"><div class="l">Cumulative GPA</div><div class="n" style="font-size:1.5rem;color:var(--ok)">${st.overall.toFixed(2)}</div><div class="d">✓ Certified</div></div>` : ''}
              ${st.bio ? `<p class="mt small"><b>Bio:</b> ${esc(st.bio)}</p>` : ''}
              ${st.skills && st.skills.length ? `<div class="tags mt">${st.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
            </div>

            ${projs.length ? `
              <div class="card">
                <h4>Verified Projects (${projs.length})</h4>
                <div class="stack mt">${projs.slice(0,4).map(p=>`
                  <div class="small" style="border-top:1px solid var(--line);padding-top:8px"><b>${esc(p.name)}</b><div class="muted">${esc(p.kind)}</div><p>${esc(p.result||p.goal||'')}</p></div>
                `).join('')}</div>
              </div>
            ` : ''}

            ${acts.length ? `
              <div class="card">
                <h4>Verified Activities (${acts.length})</h4>
                <div class="stack mt">${acts.slice(0,5).map(a=>`
                  <div class="small">✓ <b>${esc(a.title)}</b> <span class="muted">(${TYPE1[a.type]||a.type})</span></div>
                `).join('')}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).catch(err=>{
    app.innerHTML = `<div class="portal-wrap"><div class="card"><h2>Link Expired or Invalid</h2><p class="muted">${esc(err&&err.message||'This request link has already been completed or has expired.')}</p><a class="btn pri mt" href="#/guest">Enter Code Again</a></div></div>`;
  });
}

actions.guestAiDraft = el => {
  const token = el.dataset.token;
  toast('🤖 Gemini AI is drafting a personalized recommendation letter...');
  AuAPI.getGuestLetter(token).then(ctx=>{
    const st = ctx.student;
    AuAPI.aiLetter({
      student: st,
      lecturer: { name: fv('g.signer') || ctx.guestName, dept: ctx.guestEmail },
      purpose: ctx.letter.purpose,
      specificNote: ctx.letter.note,
      projects: ctx.projects,
      activities: ctx.activities,
      gpa: st.overall
    }).then(res=>{
      if(res && res.letter){
        F['g.letterBody'] = res.letter;
        renderGuestLetterPortal(token);
        toast('✨ Recommendation letter drafted by Gemini AI! Review and sign.');
      }
    }).catch(e=>{
      toast('AI generation failed: '+(e&&e.message||'Error'),'bad');
    });
  });
};

actions.guestSaveDraft = el => {
  const token = el.dataset.token;
  const body = fv('g.letterBody','').trim();
  AuAPI.submitGuestLetter(token, { action: 'draft', body }).then(()=>{
    toast('Draft saved. You can return to this link anytime.');
  }).catch(e=>toast(e.message,'bad'));
};

actions.guestSubmitLetter = el => {
  const token = el.dataset.token;
  const body = fv('g.letterBody','').trim();
  const signedBy = fv('g.signer','').trim();
  if(!body){ toast('Letter body cannot be empty.','bad'); return; }
  toast('Submitting and certifying recommendation letter...');
  AuAPI.submitGuestLetter(token, { action: 'submit', body, signedBy }).then(()=>{
    app.innerHTML = `
      <div class="portal-wrap narrow">
        <div class="card" style="text-align:center;padding:40px 20px">
          <div class="brand mb" style="justify-content:center">${logo()}</div>
          <h2 style="color:var(--ok)">✓ Recommendation Letter Submitted</h2>
          <p class="mt" style="font-size:1.1rem">Thank you, <b>${esc(signedBy)}</b>. Your recommendation letter has been securely received, certified, and attached to the candidate's portfolio.</p>
          <div class="mt"><a class="btn" href="#/login">Return to Home</a></div>
        </div>
      </div>
    `;
    toast('Letter submitted successfully!');
  }).catch(e=>toast(e.message,'bad'));
};

actions.guestDeclineLetter = el => {
  const token = el.dataset.token;
  const reply = prompt('Please provide a brief reason for declining (e.g. scheduling conflict):');
  if(reply === null) return;
  AuAPI.submitGuestLetter(token, { action: 'decline', reply }).then(()=>{
    app.innerHTML = `
      <div class="portal-wrap narrow">
        <div class="card" style="text-align:center;padding:40px 20px">
          <h2>Request Declined</h2>
          <p class="muted">You have declined this recommendation request. The student has been notified.</p>
        </div>
      </div>
    `;
  }).catch(e=>toast(e.message,'bad'));
};

function renderGuestVerifyPortal(token){
  app.innerHTML = `<div class="portal-wrap narrow"><div class="card" style="text-align:center;padding:40px 20px"><h2>Loading Activity Verification...</h2></div></div>`;
  AuAPI.getGuestVerify(token).then(res=>{
    const a = res.activity;
    const st = res.student;
    F['gv.act'] = a;
    app.innerHTML = `
      <div class="portal-wrap narrow">
        <header class="card mb" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div class="brand" style="margin:0;padding:0">${logo()}<div><b>${esc(SCHOOL)}</b><div class="muted small">Activity Verification Portal</div></div></div>
          <span class="chip ok">✓ Secure Verification Link</span>
        </header>

        <div class="card mb">
          <h2>Verify Activity for ${esc(st.name)}</h2>
          <p class="muted mb">${esc(st.programme)} · Year ${st.year} · ${esc(st.school_id||st.schoolId)}</p>

          <div class="card tint mb">
            <div class="row between">
              <b>${esc(a.title)}</b>
              <span class="chip info sm">${esc(TYPE1[a.type]||a.type)} · Year ${a.year}</span>
            </div>
            ${a.where ? `<div class="mt small"><b>Role / Location:</b> ${esc(a.where)}</div>` : ''}
            ${evidenceHtml(a)}
          </div>

          <div class="field">
            <label for="gv_by">Your Full Name &amp; Title</label>
            <input id="gv_by" data-k="gv.by" value="${esc(fv('gv.by', res.verifierName))}">
          </div>

          <div class="field">
            <label for="gv_cm">Comment or Note (Optional)</label>
            <input id="gv_cm" data-k="gv.cm" placeholder="Confirmed student participated and successfully completed their tenure.">
          </div>

          <div class="row mt">
            <button class="btn pri" data-a="guestSubmitVerify" data-token="${token}" data-status="verified">✓ Confirm &amp; Verify Entry</button>
            <button class="btn warn" data-a="guestSubmitVerify" data-token="${token}" data-status="evidence">Request More Evidence</button>
          </div>
        </div>
      </div>
    `;
  }).catch(e=>{
    app.innerHTML = `<div class="portal-wrap narrow"><div class="card"><h2>Verification Link Expired</h2><p class="muted">${esc(e&&e.message||'This verification link is invalid or already processed.')}</p></div></div>`;
  });
}

actions.guestSubmitVerify = el => {
  const token = el.dataset.token;
  const status = el.dataset.status;
  const by = fv('gv.by','').trim();
  const comment = fv('gv.cm','').trim();
  toast(status==='verified'?'Certifying activity verification...':'Sending note to student...');
  AuAPI.submitGuestVerify(token, { status, comment, verifiedBy: by }).then(()=>{
    app.innerHTML = `
      <div class="portal-wrap narrow">
        <div class="card" style="text-align:center;padding:40px 20px">
          <div class="brand mb" style="justify-content:center">${logo()}</div>
          <h2 style="color:var(--ok)">✓ Verification Submitted</h2>
          <p class="mt" style="font-size:1.1rem">Thank you, <b>${esc(by)}</b>. The entry has been marked as <b>${status==='verified'?'Verified':'Evidence Requested'}</b>.</p>
        </div>
      </div>
    `;
    toast('Verification recorded successfully!');
  }).catch(e=>toast(e.message,'bad'));
};

/* ---------- Public Sharing Privacy Settings Modal ---------- */
actions.openPublicShare = () => {
  const u = me();
  const ps = u.publicShare || { enabled: false, showGrades: true, showTranscripts: true, showProjects: true, showActs: true, showLetters: false };
  F['ps.en'] = ps.enabled;
  F['ps.grades'] = ps.showGrades !== false;
  F['ps.projs'] = ps.showProjects !== false;
  F['ps.acts'] = ps.showActs !== false;
  F['ps.letters'] = ps.showLetters === true;
  const shareUrl = window.location.origin + window.location.pathname + '#/p/' + (u.shareSlug || u.schoolId);

  openModal('🌐 Public Profile Sharing & Privacy Settings', () => `
    <p class="muted mb">Share an unauthenticated link to your verified Africa University portfolio with employers, recruiters, and graduate schools.</p>
    <div class="field">
      <label>Public Link Status</label>
      ${chk('ps.en', 'Enable Public Profile (anyone with the link can view)', F['ps.en'])}
    </div>
    <div class="field mt">
      <label>Privacy Controls: What do you want visible publicly?</label>
      ${chk('ps.grades', 'Cumulative Certified GPA & Progress', F['ps.grades'])}
      ${chk('ps.projs', 'Portfolio Projects (Goal, Role, Tech & Live Links)', F['ps.projs'])}
      ${chk('ps.acts', 'Verified Leadership, Achievements & Clubs', F['ps.acts'])}
      ${chk('ps.letters', 'Official Certified Letters of Recommendation', F['ps.letters'])}
    </div>
    <div class="field mt">
      <label>Your Public Share Link</label>
      <div class="row">
        <input id="ps_link_box" class="grow" style="min-width:180px;background:var(--tint);font-family:monospace" readonly value="${esc(shareUrl)}">
        <button class="btn sm" data-a="copy" data-t="ps_link_box">Copy Link</button>
        <a class="btn sm" href="${esc(shareUrl)}" target="_blank" rel="noopener">Preview ↗</a>
      </div>
    </div>
    <div class="row mt">
      <button class="btn pri" data-a="savePublicShare">Save Sharing Settings</button>
      <button class="btn" data-a="closeModal">Cancel</button>
    </div>
  `, { wide: true });
};

actions.savePublicShare = () => {
  const u = me();
  u.publicShare = {
    enabled: !!F['ps.en'],
    showGrades: !!F['ps.grades'],
    showTranscripts: true,
    showProjects: !!F['ps.projs'],
    showActs: !!F['ps.acts'],
    showLetters: !!F['ps.letters']
  };
  u.shareSlug = u.shareSlug || u.schoolId;
  save();
  closeModal();
  render();
  toast('Public sharing privacy settings updated!');
};




/* ======================= OPPORTUNITIES & INTERNSHIPS BOARD ======================= */
function getOpps(){
  if(!S.finals)S.finals={};
  if(!Array.isArray(S.finals.__opps)||!S.finals.__opps.length){
    S.finals.__opps=[
      {
        id:'opp_econet_01',
        title:'Software Engineering & Cloud Infrastructure Intern',
        org:'Econet Wireless Zimbabwe',
        type:'internship',
        category:'Internship / Attachment',
        location:'Harare / Hybrid',
        deadline:'2026-12-15',
        minGpa:3.0,
        targetYears:[2,3,4],
        skills:['Python','Cloud Computing','SQL','Git','Linux'],
        description:'Hands-on industrial attachment joining the Core Network and Digital Platforms engineering team at Econet. Work on microservices, cloud telemetry, and API integrations for digital service products.',
        stipend:'USD $350/mo + Data allowance',
        posterName:'Eng. Farai Chirume (Econet)',
        posterEmail:'careers@econet.co.zw',
        posterRole:'supervisor',
        createdAt:Date.now()-3*DAY,
        applications:[]
      },
      {
        id:'opp_mc_scholarship',
        title:'Mastercard Foundation Scholars Program Graduate Fellowship',
        org:'Mastercard Foundation & Africa University',
        type:'scholarship',
        category:'Scholarship',
        location:'Africa University Main Campus / Regional',
        deadline:'2026-11-30',
        minGpa:3.3,
        targetYears:[3,4],
        skills:['Leadership','Research','Community Development','Project Management'],
        description:'Full postgraduate fellowship award covering tuition, accommodation, research grant, and leadership development stipend for promising African student leaders committed to giving back to their communities.',
        stipend:'Full Tuition + USD $600/mo Living Stipend',
        posterName:'AU Financial Aid & Scholarships Office',
        posterEmail:'scholarships@africau.edu',
        posterRole:'admin',
        createdAt:Date.now()-5*DAY,
        applications:[]
      },
      {
        id:'opp_au_research',
        title:'Undergraduate Research Assistant: Applied AI & Health Informatics',
        org:'AU Department of Computer Science & Health Sciences',
        type:'research',
        category:'Research / Hackathon',
        location:'Mutare, AU Campus',
        deadline:'2026-12-01',
        minGpa:3.2,
        targetYears:[2,3,4],
        skills:['Machine Learning','Python','Data Analysis','Technical Writing'],
        description:'Join the inter-faculty research grant investigating predictive machine learning models for sub-Saharan healthcare analytics. Co-author conference papers and assist in lab testbeds.',
        stipend:'USD $200/mo Research Grant',
        posterName:'Dr. Riley Adams',
        posterEmail:'riley.adams@school.edu',
        posterRole:'staff',
        createdAt:Date.now()-2*DAY,
        applications:[]
      },
      {
        id:'opp_cassava_grad',
        title:'FinTech Graduate Trainee · Mobile Payments & Security',
        org:'Cassava Smartech / EcoCash Holdings',
        type:'job',
        category:'Job',
        location:'Harare, Zimbabwe',
        deadline:'2027-01-15',
        minGpa:3.0,
        targetYears:[3,4],
        skills:['Cybersecurity','Java','SQL','REST APIs','Financial Systems'],
        description:'Fast-track 18-month graduate rotation across digital payments, risk engines, and enterprise solutions. Open to graduating seniors and final year students.',
        stipend:'USD $700/mo Entry Trainee',
        posterName:'Casey Brooks',
        posterEmail:'casey.brooks@acme.example',
        posterRole:'supervisor',
        createdAt:Date.now()-7*DAY,
        applications:[]
      },
      {
        id:'opp_hackathon_africa',
        title:'Pan-African University AgriTech Innovation Challenge',
        org:'African Development Bank & AU Innovation Hub',
        type:'research',
        category:'Research / Hackathon',
        location:'Hybrid / Virtual',
        deadline:'2026-11-28',
        minGpa:2.5,
        targetYears:[1,2,3,4],
        skills:['Innovation','IoT','Mobile App Development','Teamwork'],
        description:'Cross-continental hackathon to build low-cost hardware and mobile solutions for smallholder farmers in Southern Africa. Winner prize pool of USD $15,000 + incubation mentorship.',
        stipend:'$15,000 Team Grand Prize',
        posterName:'Prof. Simba Muronda',
        posterEmail:'innovation@africau.edu',
        posterRole:'staff',
        createdAt:Date.now()-1*DAY,
        applications:[]
      }
    ];
  }
  return S.finals.__opps;
}

function calcOppMatch(u, opp){
  if(!u||u.role!=='student')return {score:0,badge:'',gpaOk:true,matchCount:0};
  let score=0;
  const gpa = u.overall != null ? u.overall : (u.gpas&&u.gpas.length ? semGpa(u, u.gpas.length-1) : 3.0);
  const minGpa = opp.minGpa || 2.5;

  if(gpa >= minGpa) score += 40;
  else if(gpa >= minGpa - 0.3) score += 25;
  else score += 10;

  const yr = u.year || 1;
  const targetYrs = Array.isArray(opp.targetYears) ? opp.targetYears : [1,2,3,4];
  if(targetYrs.includes(yr)) score += 25;
  else score += 10;

  const mySkills = (u.skills||[]).map(s=>String(s).toLowerCase());
  const oppSkills = (opp.skills||[]);
  let matchCount = 0;
  oppSkills.forEach(sk => {
    const lsk = String(sk).toLowerCase();
    if(mySkills.some(s => s.includes(lsk) || lsk.includes(s))) matchCount++;
  });
  const skillScore = oppSkills.length ? Math.min(35, Math.round((matchCount / oppSkills.length) * 35)) : 25;
  score += skillScore;
  score = Math.min(98, Math.max(35, score));

  let badge = '';
  if(score >= 85) badge = `<span class="chip ok" title="Your certified GPA (${fmt2(gpa)}) and skills align strongly">✓ ${score}% Match · Highly Recommended</span>`;
  else if(score >= 68) badge = `<span class="chip info" title="Strong match for your year and background">✓ ${score}% Match · Strong Fit</span>`;
  else badge = `<span class="chip warn" title="Eligible for this opportunity">● ${score}% Match · Eligible</span>`;

  return { score, badge, gpa, minGpa, gpaOk: gpa >= minGpa, matchCount };
}

function opportunitiesPage(u){
  const opps = getOpps();
  const cat = fv('opp.cat', 'all');
  const q = (fv('opp.q', '')).trim().toLowerCase();
  const isPoster = u.role === 'staff' || u.role === 'supervisor' || u.role === 'admin';

  let list = opps.slice();
  if(cat !== 'all'){
    list = list.filter(o => o.type === cat);
  }
  if(q){
    list = list.filter(o => (
      o.title.toLowerCase().includes(q) ||
      o.org.toLowerCase().includes(q) ||
      (o.skills && o.skills.some(s => s.toLowerCase().includes(q))) ||
      (o.description && o.description.toLowerCase().includes(q))
    ));
  }

  // Pre-calculate matches for students
  const withMatch = list.map(o => {
    const m = calcOppMatch(u, o);
    return { opp: o, match: m };
  });

  if(u.role === 'student'){
    withMatch.sort((a,b) => b.match.score - a.match.score);
  } else {
    withMatch.sort((a,b) => (b.opp.createdAt||0) - (a.opp.createdAt||0));
  }

  const catTabs = [
    ['all', `All Opportunities (${opps.length})`],
    ['internship', 'Internships & Attachments'],
    ['scholarship', 'Scholarships'],
    ['job', 'Graduate Jobs'],
    ['research', 'Research & Challenges']
  ];

  const catPills = `<div class="tabs mb" role="group" aria-label="Opportunity categories">${catTabs.map(([v, l]) => `<button type="button" data-a="setOppCat" data-v="${v}" aria-pressed="${cat===v}">${l}</button>`).join('')}</div>`;

  return `${crumbs([['Home', '/'+u.role], ['Opportunities']])}
    <div class="pagehead">
      <div>
        <h1>Opportunities &amp; Internship Board</h1>
        <p class="sub">Curated industrial attachments, graduate trainee slots, scholarships, and research assistantships for Africa University.</p>
      </div>
      <div class="row">
        ${isPoster ? `<button class="btn pri" data-a="openPostOppModal">+ Post an Opportunity</button>` : ''}
      </div>
    </div>

    ${u.role === 'student' ? `
      <div class="banner info mb">
        <b>Smart Career Matching Active:</b> We compare your Certified GPA (${u.overall != null ? fmt2(u.overall) : '–'}), study year (Year ${u.year||1}), and verified profile skills against each opportunity to show your exact readiness score.
      </div>
    ` : ''}

    <div class="card mb">
      <div class="row between" style="gap:12px;flex-wrap:wrap">
        <div class="field grow" style="margin:0;min-width:240px">
          <input data-k="opp.q" data-live="oppFilter" value="${esc(fv('opp.q'))}" placeholder="⌕ Search by role, company, or skill (e.g. Python, Econet, Machine Learning)..." aria-label="Search opportunities">
        </div>
        <div class="row" style="margin:0">
          <span class="muted small">${withMatch.length} opportunity ${withMatch.length===1?'listing':'listings'}</span>
        </div>
      </div>
    </div>

    ${catPills}

    <div class="stack" style="gap:16px">
      ${withMatch.length ? withMatch.map(({opp: o, match: m}) => {
        const apps = o.applications || [];
        const myApp = u.role === 'student' ? apps.find(a => a.sid === u.id || a.email === u.email) : null;
        const targetStr = Array.isArray(o.targetYears) ? o.targetYears.map(y => 'Year ' + y).join(', ') : 'All years';
        const isMyPost = (o.posterEmail && o.posterEmail.toLowerCase() === (u.email||'').toLowerCase()) || (u.role === 'admin');

        return `
          <div class="card" style="border-left: 4px solid var(--pri)">
            <div class="row between" style="align-items:flex-start;flex-wrap:wrap;gap:8px">
              <div style="flex:1;min-width:260px">
                <div class="row" style="gap:8px;margin-bottom:4px;flex-wrap:wrap">
                  <span class="chip" style="font-weight:700;background:var(--line)">${esc(o.org)}</span>
                  <span class="chip" style="text-transform:capitalize">${esc(o.category || o.type)}</span>
                  <span class="muted small">📍 ${esc(o.location || 'Africa University')}</span>
                </div>
                <h2 style="font-size:1.25rem;margin:4px 0 6px">${esc(o.title)}</h2>
                <div class="muted small">
                  Posted by <b>${esc(o.posterName || 'Africa University Partner')}</b> · Closes ${esc(o.deadline || 'Rolling')}
                </div>
              </div>
              <div style="text-align:right;min-width:180px">
                ${u.role === 'student' ? `<div style="margin-bottom:6px">${m.badge}</div>` : ''}
                ${o.stipend ? `<div class="small" style="font-weight:600;color:var(--ok)">${esc(o.stipend)}</div>` : ''}
              </div>
            </div>

            <p style="margin:12px 0 14px;line-height:1.55">${esc(o.description)}</p>

            <div class="grid g2" style="background:var(--tint);padding:10px 14px;border-radius:6px;margin-bottom:14px">
              <div class="small">
                <b>Eligibility:</b> Open to ${esc(targetStr)} · Min Certified GPA: <b>${fmt2(o.minGpa || 2.5)}</b>
                ${u.role === 'student' ? `<span style="margin-left:6px;color:var(--${m.gpaOk?'ok':'warn'})">(${m.gpaOk?'✓ You qualify':'▲ Below target'})</span>` : ''}
              </div>
              <div class="small">
                <b>Required Skills:</b> ${(o.skills||[]).map(s => {
                  const hasSkill = u.role === 'student' && (u.skills||[]).some(sk => sk.toLowerCase().includes(s.toLowerCase()));
                  return `<span class="tag" style="${hasSkill?'font-weight:bold;border-color:var(--ok);color:var(--ok)':''}">${esc(s)}${hasSkill?' ✓':''}</span>`;
                }).join(' ')}
              </div>
            </div>

            <div class="row between" style="flex-wrap:wrap;gap:10px;border-top:1px solid var(--line);padding-top:12px">
              <div class="small muted">
                ${apps.length} applicant${apps.length===1?'':'s'} applied with verified portfolio
              </div>
              <div class="row" style="flex-wrap:wrap;gap:8px">
                ${u.role === 'student' ? (
                  myApp ? `
                    <span class="chip ok">✓ You Applied with Verified Portfolio (${fmtD(myApp.appliedAt)})</span>
                    <button type="button" class="btn sm" data-a="oppRequestLetter" data-id="${o.id}">Request Recommendation Letter</button>
                  ` : `
                    <button type="button" class="btn pri" data-a="applyOppModal" data-id="${o.id}">Apply with Verified Portfolio</button>
                    <button type="button" class="btn" data-a="oppRequestLetter" data-id="${o.id}">Request Recommendation for This</button>
                  `
                ) : ''}

                ${isPoster ? `
                  <button type="button" class="btn sm pri" data-a="viewOppApplicants" data-id="${o.id}">View Applicants (${apps.length})</button>
                  ${isMyPost ? `<button type="button" class="btn sm bad" data-a="deleteOpp" data-id="${o.id}">Remove</button>` : ''}
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('') : `
        <div class="empty">
          No opportunities match your filter. Try clearing the search or category filter.
        </div>
      `}
    </div>
  `;
}

actions.setOppCat = el => {
  F['opp.cat'] = el.dataset.v;
  render();
};
live.oppFilter = () => {
  render();
};

/* Apply Modal for Students */
actions.applyOppModal = el => {
  const oppId = el.dataset.id;
  const opp = getOpps().find(o => o.id === oppId);
  const u = me();
  if(!opp || !u) return;

  const m = calcOppMatch(u, opp);
  F['app.note'] = '';
  F['app.shareVerified'] = true;
  ui.err = {};

  openModal('Apply with Verified Portfolio', () => `
    <div class="mb">
      <div class="row between" style="margin-bottom:6px">
        <div>
          <b>${esc(opp.title)}</b>
          <div class="muted small">${esc(opp.org)} · Deadline: ${esc(opp.deadline)}</div>
        </div>
        <div>${m.badge}</div>
      </div>
    </div>

    <div class="card tint mb" style="padding:12px 14px">
      <h4 style="margin:0 0 6px">Verified Credentials Snapshot Attached</h4>
      <div class="grid g2 small">
        <div><b>Student:</b> ${esc(u.name)} (${esc(u.schoolId)})</div>
        <div><b>Certified CGPA:</b> <span style="color:var(--ok);font-weight:700">${u.overall != null ? fmt2(u.overall) : '–'}</span> (Official AU Registry)</div>
        <div><b>Programme:</b> ${esc(u.programme)} · Year ${u.year||1}</div>
        <div><b>Verified Projects:</b> ${myProjects(u.id).length} projects · ${myActs(u.id).filter(a=>a.status==='verified').length} verified activities</div>
      </div>
    </div>

    <form data-submit="doApplyOpp" data-id="${opp.id}" novalidate>
      <div class="field ${ui.err['app.note']?'has-err':''}">
        <label for="f_app_note">Personal Note / Cover Pitch for Employer</label>
        <textarea id="f_app_note" data-k="app.note" rows="4" placeholder="Briefly introduce yourself, explain why you are interested in this position at ${esc(opp.org)}, and mention your relevant experience or project builds...">${esc(fv('app.note'))}</textarea>
        ${ui.err['app.note'] ? `<div class="errmsg">${esc(ui.err['app.note'])}</div>` : ''}
        <div class="hint">The employer will receive this note along with your verified transcript and portfolio credentials.</div>
      </div>

      <div class="field mb">
        ${chk('app.shareVerified', 'Include certified transcript results and certified GPA in my verified application package', true)}
      </div>

      <div class="row mt">
        <button class="btn pri" type="submit">Submit Verified Application</button>
        <button type="button" class="btn" data-a="closeModal">Cancel</button>
      </div>
    </form>
  `);
};

submits.doApplyOpp = form => {
  const oppId = form.dataset.id;
  const opp = getOpps().find(o => o.id === oppId);
  const u = me();
  if(!opp || !u) return;

  const note = (fv('app.note')||'').trim();
  ui.err = {};
  if(!note){
    ui.err['app.note'] = 'Please write a brief cover note for the employer.';
    return renderModal();
  }

  opp.applications = opp.applications || [];
  if(opp.applications.some(a => a.sid === u.id)){
    closeModal();
    toast('You have already applied for this opportunity.');
    return;
  }

  const m = calcOppMatch(u, opp);
  const newApp = {
    id: uid('app'),
    sid: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    schoolId: u.schoolId || '',
    programme: u.programme || '',
    year: u.year || 1,
    gpa: u.overall != null ? u.overall : null,
    matchScore: m.score,
    note: note,
    appliedAt: Date.now()
  };

  opp.applications.push(newApp);
  addLog(`${u.name} applied for ${opp.title} at ${opp.org}`);
  save();

  // Dispatch background notification email to poster
  if(AU_CONFIG.USE_BACKEND && window.AuAPI && AuAPI.notifyOpportunityApplication){
    AuAPI.notifyOpportunityApplication({
      oppId: opp.id,
      oppTitle: opp.title,
      posterEmail: opp.posterEmail,
      posterName: opp.posterName,
      studentName: u.name,
      studentEmail: u.email,
      gpa: u.overall,
      programme: u.programme,
      note: note,
      matchScore: m.score
    }).catch(e => console.warn('Notification email dispatch issue:', e.message));
  }

  closeModal();
  render();
  toast(`Application submitted to ${opp.org}! Employer notified.`);
};

/* Request Letter prefilled for Opportunity */
actions.oppRequestLetter = el => {
  const oppId = el.dataset.id;
  const opp = getOpps().find(o => o.id === oppId);
  if(!opp) return;

  F['lt.purpose'] = `${opp.title} (${opp.org})`;
  F['lt.note'] = `Applying for the ${opp.title} position at ${opp.org}. Application deadline is ${opp.deadline}. Min GPA: ${opp.minGpa}. Required skills: ${(opp.skills||[]).join(', ')}. Please highlight my academic performance and verified projects.`;
  F['lt.due'] = opp.deadline;
  ui.err = {};

  go('/student/letters');
  toast('Recommendation request form pre-filled for this opportunity! Select your recommender.');
};

/* View Applicants Modal for Posters */
actions.viewOppApplicants = el => {
  const oppId = el.dataset.id;
  const opp = getOpps().find(o => o.id === oppId);
  if(!opp) return;

  const apps = opp.applications || [];

  openModal(`Applicants for ${opp.title} (${apps.length})`, () => `
    <div class="mb">
      <div class="muted small"><b>Organization:</b> ${esc(opp.org)} · <b>Deadline:</b> ${esc(opp.deadline)} · <b>Min GPA:</b> ${fmt2(opp.minGpa||2.5)}</div>
    </div>

    ${apps.length ? `
      <div class="stack" style="gap:12px">
        ${apps.map(a => `
          <div class="card tint" style="padding:14px">
            <div class="row between" style="align-items:flex-start;flex-wrap:wrap;gap:8px">
              <div>
                <b>${esc(a.name)}</b> <span class="muted small">(${esc(a.schoolId || a.email)})</span>
                <div class="small muted">${esc(a.programme || 'Degree Student')} · Year ${a.year || 1}</div>
              </div>
              <div style="text-align:right">
                <span class="chip ok">Certified GPA: ${a.gpa != null ? fmt2(a.gpa) : '–'}</span>
                ${a.matchScore ? `<div class="small" style="color:var(--ok);font-weight:600">${a.matchScore}% Match Score</div>` : ''}
              </div>
            </div>

            <div class="card mt" style="background:var(--bg);margin-top:8px;padding:10px 12px">
              <div class="small muted" style="margin-bottom:2px">Applicant Cover Note:</div>
              <p style="margin:0;font-size:0.92rem;line-height:1.45">${esc(a.note)}</p>
            </div>

            <div class="row between mt small muted" style="margin-top:8px">
              <span>Applied ${fmtD(a.appliedAt)} · Email: <a href="mailto:${esc(a.email)}">${esc(a.email)}</a></span>
              <div class="row" style="gap:6px">
                <button type="button" class="btn sm pri" data-a="previewApplicant" data-sid="${esc(a.sid||'')}" data-schoolid="${esc(a.schoolId||'')}" data-oppid="${esc(opp.id)}">👁 View Verified Portfolio</button>
                <a class="btn sm" href="#/p/${esc(a.schoolId||a.sid)}" target="_blank" title="Open public verified credential in new tab">🌐 Public Link</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty">No students have applied for this listing yet. Once students apply with their verified portfolio, their credentials will show here.</div>
    `}
  `, { wide: true });
};


/* Preview Verified Applicant Dossier for Posters & Supervisors */
actions.previewApplicant = el => {
  const sid = el.dataset.sid;
  const schoolId = el.dataset.schoolid;
  const oppId = el.dataset.oppid;
  const opp = getOpps().find(o => o.id === oppId);
  const s = user(sid) || S.users.find(u => (u.schoolId && u.schoolId === schoolId) || u.id === sid);

  if(!s){
    toast('Student record not found.', 'bad');
    return;
  }

  const app = opp && opp.applications ? opp.applications.find(a => a.sid === s.id || a.email === s.email || a.schoolId === s.schoolId) : null;
  const projs = myProjects(s.id);
  const acts = myActs(s.id);
  const verifiedActs = acts.filter(a => a.status === 'verified');

  openModal(`Verified Applicant Dossier · ${esc(s.name)}`, () => `
    <div class="card mb" style="border-left:4px solid var(--ok)">
      <div class="row between" style="align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div class="row" style="gap:14px">
          ${avatar(s, 64, false)}
          <div>
            <h2 style="margin:0 0 4px">${esc(s.name)}</h2>
            <div class="muted small">${esc(s.programme || 'Degree Student')} · Year ${s.year || 1} · School ID: <b>${esc(s.schoolId || '–')}</b></div>
            <div class="small muted" style="margin-top:2px">Email: <a href="mailto:${esc(s.email)}">${esc(s.email)}</a> ${s.phone ? '· Phone: ' + esc(s.phone) : ''}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div class="chip ok" style="font-size:0.95rem;padding:6px 12px">✓ Official CGPA: <b>${s.overall != null ? fmt2(s.overall) : '–'}</b></div>
          <div class="small muted" style="margin-top:4px">Certified by Africa University Registry</div>
          ${app && app.matchScore ? `<div class="small" style="color:var(--ok);font-weight:700;margin-top:2px">${app.matchScore}% Career Match Score</div>` : ''}
        </div>
      </div>
    </div>

    ${app && app.note ? `
      <div class="card tint mb" style="padding:14px">
        <h4 style="margin:0 0 6px">Cover Pitch Submitted for ${esc(opp ? opp.title : 'this opportunity')}</h4>
        <p style="margin:0;line-height:1.55;font-size:0.95rem">${esc(app.note)}</p>
        <div class="small muted mt" style="margin-top:6px">Submitted on ${fmtD(app.appliedAt)}</div>
      </div>
    ` : ''}

    ${s.bio ? `
      <div class="card mb">
        <h4 style="margin:0 0 6px">About ${esc(first(s.name))}</h4>
        <p style="margin:0 0 8px;line-height:1.5">${esc(s.bio)}</p>
        <div class="tags">${(s.skills||[]).map(sk => `<span class="tag">${esc(sk)}</span>`).join('')}</div>
      </div>
    ` : ''}

    <div class="card mb">
      <div class="row between mb">
        <h4 style="margin:0">Verified Projects (${projs.length})</h4>
        <span class="small muted">Certified Student Builds</span>
      </div>
      ${projs.length ? `
        <div class="stack" style="gap:10px">
          ${projs.map(p => `
            <div class="card tint" style="padding:10px 14px">
              <div class="row between" style="margin-bottom:4px">
                <b>${esc(p.name)}</b>
                <span class="chip info sm">${esc(p.kind || 'Project')}</span>
              </div>
              <p style="margin:0 0 6px;font-size:0.9rem;line-height:1.45">${esc(p.goal || p.result || '')}</p>
              ${p.link ? `<a class="btn sm" href="${esc(p.link)}" target="_blank" rel="noopener">View Project / Code ↗</a>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `<div class="empty">No projects added yet.</div>`}
    </div>

    <div class="card mb">
      <div class="row between mb">
        <h4 style="margin:0">Verified Leadership &amp; Activities (${verifiedActs.length})</h4>
        <span class="small muted">Faculty Verified</span>
      </div>
      ${verifiedActs.length ? `
        <div class="list">
          ${verifiedActs.map(a => `
            <div class="item">
              <div>
                <b>${esc(a.title)}</b>
                <div class="muted small">${esc(TYPE1[a.type] || a.type)} · Year ${a.year}${a.where ? ' · ' + esc(a.where) : ''}</div>
              </div>
              <span class="chip ok">✓ Verified</span>
            </div>
          `).join('')}
        </div>
      ` : `<div class="empty">No verified activities yet.</div>`}
    </div>

    <div class="row between mt pt" style="border-top:1px solid var(--line);gap:10px;flex-wrap:wrap">
      <div class="row" style="gap:8px">
        <a class="btn pri" href="mailto:${esc(s.email)}?subject=Africa%20University%20Application%20-%20${encodeURIComponent(opp ? opp.title : 'Opportunity')}">✉ Contact via Email</a>
        <a class="btn" href="#/p/${esc(s.schoolId || s.id)}" target="_blank">🌐 Standalone Public Credential</a>
      </div>
      <button type="button" class="btn" data-a="viewOppApplicants" data-id="${oppId}">← Back to Applicants List</button>
    </div>
  `, { wide: true });
};

/* Post Opportunity Modal */
actions.openPostOppModal = () => {
  const u = me();
  if(!u) return;
  const defOrg = u.role === 'supervisor' ? (u.company || 'Partner Employer') : (u.dept || 'Africa University');
  F['opp.in_title'] = '';
  F['opp.in_org'] = defOrg;
  F['opp.in_type'] = u.role === 'supervisor' ? 'internship' : 'research';
  F['opp.in_loc'] = 'Harare / Hybrid';
  F['opp.in_deadline'] = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
  F['opp.in_gpa'] = '3.0';
  F['opp.in_skills'] = 'Python, SQL, Problem Solving';
  F['opp.in_stipend'] = 'USD $300/mo attachment allowance';
  F['opp.in_desc'] = '';
  ui.err = {};

  openModal('+ Post an Opportunity', () => `
    <form data-submit="saveOpp" novalidate>
      <div class="grid g2">
        ${fld('opp.in_title', {label: 'Opportunity Title', ph: 'e.g. Cybersecurity Operations Intern'})}
        ${fld('opp.in_org', {label: 'Company or Department', ph: 'e.g. Econet, Africa University CS Dept'})}
        ${selF('opp.in_type', [
          ['internship', 'Internship / Attachment'],
          ['scholarship', 'Scholarship / Fellowship'],
          ['job', 'Graduate Trainee / Job'],
          ['research', 'Research Assistantship / Hackathon']
        ], {label: 'Category'})}
        ${fld('opp.in_loc', {label: 'Location / Work Mode', ph: 'e.g. Harare, Mutare, or Remote'})}
        ${fld('opp.in_deadline', {label: 'Application Deadline', type: 'date'})}
        ${fld('opp.in_gpa', {label: 'Minimum Certified GPA', ph: '3.0'})}
        ${fld('opp.in_skills', {label: 'Required Skills (comma separated)', ph: 'Python, Git, SQL, Docker'})}
        ${fld('opp.in_stipend', {label: 'Stipend / Grant / Prize', ph: 'e.g. USD $350/mo or Full Grant'})}
      </div>

      <div class="field ${ui.err['opp.in_desc']?'has-err':''}">
        <label for="f_opp_desc">Opportunity Description &amp; Responsibilities</label>
        <textarea id="f_opp_desc" data-k="opp.in_desc" rows="4" placeholder="Detail the duties, learning outcomes, and prerequisites for this role...">${esc(fv('opp.in_desc'))}</textarea>
        ${ui.err['opp.in_desc'] ? `<div class="errmsg">${esc(ui.err['opp.in_desc'])}</div>` : ''}
      </div>

      <div class="row mt">
        <button class="btn pri" type="submit">Publish Opportunity</button>
        <button type="button" class="btn" data-a="closeModal">Cancel</button>
      </div>
    </form>
  `, { wide: true });
};

submits.saveOpp = () => {
  const u = me();
  if(!u) return;
  const title = (fv('opp.in_title')||'').trim();
  const org = (fv('opp.in_org')||'').trim();
  const type = fv('opp.in_type', 'internship');
  const loc = (fv('opp.in_loc')||'').trim();
  const deadline = fv('opp.in_deadline');
  const minGpa = parseFloat(fv('opp.in_gpa')) || 2.5;
  const skillsStr = (fv('opp.in_skills')||'').trim();
  const stipend = (fv('opp.in_stipend')||'').trim();
  const desc = (fv('opp.in_desc')||'').trim();

  ui.err = {};
  if(!title) ui.err['opp.in_title'] = 'Enter the opportunity title.';
  if(!org) ui.err['opp.in_org'] = 'Enter the company or department name.';
  if(!desc) ui.err['opp.in_desc'] = 'Enter a description for the role.';
  if(Object.keys(ui.err).length) return renderModal();

  const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  const opps = getOpps();

  const newOpp = {
    id: 'opp_' + Math.random().toString(36).slice(2, 9),
    title,
    org,
    type,
    category: type === 'internship' ? 'Internship / Attachment' : type === 'scholarship' ? 'Scholarship' : type === 'job' ? 'Job' : 'Research / Hackathon',
    location: loc || 'Africa University',
    deadline: deadline || new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10),
    minGpa,
    targetYears: [2, 3, 4],
    skills,
    description: desc,
    stipend: stipend || 'Competitive Allowance',
    posterName: u.name,
    posterEmail: u.email,
    posterRole: u.role,
    createdAt: Date.now(),
    applications: []
  };

  opps.unshift(newOpp);
  addLog(`${u.name} posted opportunity: ${title} at ${org}`);
  save();

  closeModal();
  render();
  toast(`Opportunity "${title}" has been published!`);
};

actions.deleteOpp = el => {
  const oppId = el.dataset.id;
  const opps = getOpps();
  const idx = opps.findIndex(o => o.id === oppId);
  if(idx >= 0){
    const rem = opps.splice(idx, 1)[0];
    save();
    render();
    toast(`Opportunity "${rem.title}" removed.`);
  }
};

/* ---------- start ---------- */
window.__spw={render,go,get S(){return S},set SES(v){SES=v},get SES(){return SES},get F(){return F},actions,submits,seed,user,setS(v){S=v}};
render();


})();
