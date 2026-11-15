/* Original pixel-art sprite engine — every image in the app is drawn from the templates below (nothing is copied from the game).
   Templates are small character grids: '.' empty; o outline b base h highlight s shade a accent (all derived from the item's colours);
   fixed colours: w white k black g leaf-green G dark-green n wood N dark-wood m metal M dark-metal y yellow r red p pink c water t tan. */
(function () {
  const U = SDV.util;
  const T = {};
  const def = (name, s) => (T[name] = s.trim().split(/\s+/));

  /* ---------- Fish & sea ---------- */
  def('fish', `......ooooo.....  ....oobbbbboo.o.  ..ooobbhhbbbbooo  .obbbbbbhbbbbbbo  obwkbbbbbbbbaaao  obbbbbbbbbbaaoo.  .oobbbbaaabbbooo  ...ooobbbbooo.o.  ......ooooo.....`);
  def('eel', `...............  ...ooooo.......  ..obbbbboo.....  ..obwkbbbbooo...  ...oobbbbbbboo..  .....ooobbbbbo..  ..oo....oobbbo..  .obbo.....obbo..  .obbbo...obbbo..  ..obbboooobbo...  ...ooobbbboo....  .....oooooo.....`);
  def('ray', `................  .......oo.......  ......obbo......  ....oobbbboo....  ..ooobbhhbbooo..  .obbbbwkkwbbbbo..  ..oobbbbbbbbboo..  ....oobbbbboo....  .....obbbbbo.....  ......obbbo......  .......obo.......  ........o........`);
  def('squid', `.....ooooo......  ....obbbbbo.....  ...obbhhbbbo....  ...obwkbbwkbo...  ...obbbbbbbo....  ....obbbbbo.....  ...obobobobo.....  ..obobobobobo....  ..o.o.o.o.o.o....`);
  def('crab', `..o.........o...  .obo.......obo.  .obbo.ooooo.obbo  ..obbobbbbbobbo.  ...ooobwbwbooo..  ....obbbbbbbo...  ...obbhhbbbbbo..  ..o.obbbbbbo.o..  .o..o.o.o.o..o..`);
  def('puffer', `.....oooooo.....  ...ooobbbboo...  ..obbhhbbbbbo...  .obbwkbbbbbbbo..  .obbbbbbbbbbbaoo  .obbbbbbbbbbaaoo  ..obbbbaaabbbo...  ...ooobbbbboo...  .....oooooo.....`);
  def('shell', `................  ....oooooo......  ..ooobbbbboo....  .obbbhbhbbbbo...  obbbhbhbhbbbbo..  obbhbhbhbhbbbo..  obbbhbhbhbbbbo..  .obbbbbbbbbbo...  ..ooooooooooo...`);

  /* ---------- Crops, forage, trees ---------- */
  def('root', `.....g.g.g......  ....gggGggg.....  .....ggGgg......  ......obbo......  .....obbhbo.....  .....obbhbo.....  .....obbbbo.....  ......obbo......  ......obbo......  .......oo.......`);
  def('leaf', `...g...g...g....  ..ggg.ggg.ggg...  .ggGggggGgggGg..  .gggGgggggGgggg.  ..ggggGggGgggg...  ...gggbggbggg....  ....ggbbbbgg.....  .....obbbbo......  ......obbo.......`);
  def('round', `.......gg.......  ......gGg.......  .....gggg.......  ....ooooooo.....  ..ooobbbbboo....  .obbbhhbbbbbo...  .obbhhbbbbbbo...  .obbbbbbbbbbo...  .obbbbbbbbsso...  ..obbbbbbssso...  ...ooobbbooo....  .....ooooo......`);
  def('gourd', `......nnn.......  .....nnGn.......  ...ooooooooo.....  ..obbhbbhbbbo....  .obbhbbhbbbbbo...  .obhbbhbbbbbbo...  .obbbbhbbsbbbo...  .obbbbhbbsbbbo...  .obbbbbhbbsbo....  ..obbbbbbsso.....  ...ooooooooo.....`);
  def('flower', `.....pppp.......  ....ppaapp......  ...pppaaappp.....  ....ppaapp......  .....pppp.......  ......gg........  ....g.gg.g......  ....gggggg......  ......gg........  ......gg........`);
  def('grain', `.......y........  ......yby.......  .....yby.y......  ....yby.yby.....  ...yby..yby.....  ....y.yby.y.....  ......ybyby......  .......yy........  ......gg.........  ......gg.........  ......gg.........`);
  def('berry', `.......gg.......  ......gGg.......  ....ooo.ooo.....  ...obbbobbbo....  ..obhbbobhbbo...  ..obbbbobbbbo...  ...obbbbbbbo....  ....obbbbbo.....  .....ooooo......`);
  def('bean', `.........gg.....  ........gGg.....  .......obbbo.....  ......obhbbo.....  .....obhbbo......  ....obhbbo.......  ...obhbbo........  ..obhbbo.........  ..obbbo..........  ...ooo...........`);
  def('bulb', `.......g.........  ......gg.........  .....ggg.........  ....ooooo........  ...obbhbbo.......  ..obbhbbbbo......  ..obbbbbbbo......  ..obbbbbbso......  ...obbbbso.......  ....ooooo........`);
  def('tree', `....ggggggg.....  ..gggggGggggg...  .ggbggggggbggg..  ggggggGggggggg..  .gggbgggggbgggg.  ..ggggGgggggg...  ...ggggggggg....  .......nn........  .......nn........  .......nn........  ......nnnn.......`);
  def('mushroom', `....oooooo......  ..ooobbbbboo....  .obbhhbbwbbbo...  obbhbbbbbbwbbo..  obbbbbbbbbbbbo..  .ooooobbooooo...  .....obtto......  .....obtto......  .....ottto......  ......ooo.......`);
  def('nut', `.....nnn.........  ....obbbo.......  ...obhbbbo......  ..obhbbbbbo.....  ..obbbbbbso.....  ..obbbbbsso.....  ...obbbsso......  ....ooooo.......`);

  /* ---------- Minerals & artifacts ---------- */
  def('gem', `................  ....oooooooo....  ...obhwhbbbbo...  ..obhhbbbbbbbo..  .obhhbbbbbbbbbo.  .oobbbbbbbbbbso.  ..obbbbbbbbbsso..  ...obbbbbbbsso...  ....obbbbbsso....  .....obbbsso.....  ......obsso......  .......oo........`);
  def('oval', `................  ....oooooo......  ...obhhbbbo.....  ..obhwbbbbbo....  .obhbbbbbbbbo...  .obbbbbbbbbso...  .obbbbbbbbsso...  ..obbbbbbsso....  ...obbbbsso.....  ....oooooo......`);
  def('rock', `................  ......oooo......  ....oobbbboo....  ...obbhhbbbbo...  ..obbhbbbbbbbo..  .obbbbbbbbbbbbo.  .obbbbbbaabbbbo.  .obbbbbbaabbsso.  ..obbbbbbbbsso..  ...ooooooooooo..`);
  def('crystal', `.......oo.......  ......obho......  ......obbo......  ..oo..obbo..oo..  .obho.obbo.obho.  .obbo.obbo.obbo.  .obbooobbooobbo.  .obbbbobbobbbbo.  ..obbbbbbbbbbo..  ...oooooooooo...`);
  def('vase', `.....oooooo.....  ....obbbbbo.....  .....obbbo......  ....obbhbbo.....  ...obbhbbbbo....  ..obbhbaabbbo...  ..obbbbaabbso...  ..obbbbbbbbso...  ...obbbbbbsso...  ....obbbbsso....  .....oooooo.....`);
  def('bone', `.oo.........oo...  obbo.......obbo.  .obbo.....obbo..  ..obbo...obbo...  ...obbo.obbo....  ....obbbbbo.....  ...obbo.obbo....  ..obbo...obbo...  .obbo.....obbo..  obbo.......obbo.  .oo.........oo..`);
  def('scroll', `..oooooooooo....  .obbbbbbbbbbo...  .obbbbbbbbbbo...  ..oobbbbbbboo...  ...obabaabbo....  ...obbbbbbbo....  ...obaabbabo....  ...obbbbbbbo....  .oobbbbbbbboo...  .obbbbbbbbbbo...  ..oooooooooo....`);
  def('disc', `....oooooo......  ..ooobbbbboo....  .obbbhhbbbbbo...  .obbhoooobbbo...  obbbhoaaoobbbo..  obbbbobboobbso..  .obbbooooobsso..  .obbbbbbbbssso..  ..ooobbbbsoo....  ....oooooo......`);
  def('doll', `....ooooooo.....  ...obbbbbbbo....  ..obwkbbwkbbo...  ..obbbbbbbbbo...  ...obbaaabbo....  ....obbbbbo.....  ...obbbbbbbo....  ..obbbbbbbbbo...  ..obo.obo.obo...  ...o...o..o.....`);
  def('trilobite', `....oooooo......  ..ooobbbbboo....  .obbhhbbhbbbo...  obbbbbbbbbbbbo..  obabababababbo..  obbbbbbbbbbbbo..  .obbbbbbbbbbo...  ..ooobbbbbooo...  ....oooooo......`);

  /* ---------- Tools, weapons, gear ---------- */
  def('pickaxe', `..ooooooooo.....  .omMMMMMMMmo...  omMmmmmmmMMmo..  oMo..nn..oMo...  oo...nn...oo...  .....nn.........  .....nn.........  .....nn.........  .....nn.........  .....oo.........`);
  def('axe', `....oooo........  ...ommmmo.......  ..ommmMMmo......  ..ommmMMmmo.....  ..ommmMMmo..n...  ...oommmo..nn....  .......onn.......  ......nn.........  .....nn..........  ....nn...........  ....oo...........`);
  def('hoe', `....oooooooo....  ...ommmmmMMmo..  ...oMMMMMMmo...  .......nn.........  .......nn.........  .......nn.........  .......nn.........  .......nn.........  .......oo.........`);
  def('can', `.....oooooo.....  ....obbbbbo.....  ..oooobbbbooo...  .obbbobbbbbbbo..  .obbbbbbbbbbbbo.  .obhbbbbbbbbbbmm  .obbbbbbbbbbbmmo  .obbbbbbbbbsso..  ..ooooooooooo...`);
  def('rod', `..............nn  .............nn.  ............nn..  ...........nn...  ..........nn....  .........nn.....  ........nn.......  .......nn........  ......nn.........  .....nn..........  ....nn.....r.....  ...nn......r.....  ..nn.......ooo...  ..........oyyo...`);
  def('scythe', `....oooooo......  ..ooMMMMMMo.....  .oMmmmmmooMo....  oMmmoo..oooo....  omoo....nn.......  oo......nn.......  ........nn.......  ........nn.......  ........nn.......  ........oo.......`);
  def('pan', `................  ....oooooooo....  ..ooMMMMMMMMoo..  .oMmmmmmmmmmmMo..  oMmmMMMMMMMmmMo..  .oMmmmmmmmmmMo...  ..ooMMMMMMMMoo...  ....oooooooo....`);
  def('pail', `...oo......oo...  ...omoooooomo...  ....obbbbbbo....  ...obbbbbbbbo...  ...obhbbbbbbo...  ...obbbbbbbso...  ...obbbbbbsso...  ....obbbbsso....  .....oooooo.....`);
  def('shears', `..oo.....oo.....  .ommo...ommo...  .omMo...oMmo...  ..oMmo.omMo....  ...oMmoMmo.....  ....oMMMo......  ...onoMoMno....  ..onno.o.onno...  ..onno...onno...  ...oo.....oo....`);
  def('sword', `..............oo  .............owo  ............owmo  ...........owmo.  ..........owmo..  .........owmo...  ..o.....owmo....  ..oo...owmo.....  ...oo.owmo......  ....oowmo.......  .....oyo........  ....onno........  ...onno.........  ...oo...........`);
  def('dagger', `...........oo...  ..........owo...  .........owmo...  ........owmo....  .......owmo.....  ....o.owmo......  ....ooowmo......  .....oyyo.......  ....onno........  ...onno.........  ...oo...........`);
  def('club', `..........oooo..  .........obbbbo.  ........obhbbbo.  .......obhbbbo..  ......obhbbbo...  .....obbbbo.....  ....obbbbo......  ...obbbo........  ..obbbo.........  ..obbo..........  ...oo...........`);
  def('boot', `...ooooooo......  ...obbbbbo......  ...obhbbbo......  ...obbbbbo......  ...obbbbbo......  ...obbbbboooo...  ...obbbbbbbbbo..  ..obbbbbbbbbbbo.  ..ooooooooooooo.  ..oaaaaaaaaaao..  ...oooooooooo...`);
  def('ring', `.....oooooo.....  ....owwwwwo....  ...owyyyywo....  ...oyoooooyo...  ..owyo....oyo...  ..oyyo....oyyo..  ..owyo....oyo...  ...oyyoooyyo....  ....ooyyyoo.....  .....oooooo.....`);

  /* ---------- Food & drink ---------- */
  def('bowl', `....w.w..w......  .....w..w.w.....  ....w.w..w......  ..oooooooooooo..  .oaaabbaabbaaao.  .oaabbaabbaabbo.  ..obbbbbbbbbbo...  ...obbbbbbbbo....  ....oooooooo.....`);
  def('plate', `................  ....oaaaaao.....  ..oaabbbbbaao...  .oabbhbbbbbbao..  oabbbbbbbaabbao.  oabbbbbbaabbbao.  .oabbbbbbbbbao..  ..oaabbbbbaao...  ...ooooooooo....`);
  def('cake', `.......rr.......  ......rrrr......  .....oooooo......  ...oowwwwwwoo....  ..owwwwhwwwwwo...  ..obbbbbbbbbbo...  .obbhbbbbbbbbbo..  .obbbbbbbbbbbbo..  .obbbbbbbbbbbso..  ..ooooooooooooo..`);
  def('pie', `................  ...ooooooooo....  ..obbbbbbbbbo...  .obabababababo..  .obbbbbbbbbbbo..  .obbbbbbbbbbso..  .ottttttttttto..  ..ooooooooooo...`);
  def('drink', `..........ppp...  .........pppp...  ..ooooooooo.....  ..ocbbbbbbo.....  ..ocbbbhbbo.....  ...obbbbbo......  ...obbbbbo......  ....obbbo.......  .....obo........  .....obo........  ....ooooo.......`);
  def('bread', `................  ....ooooooo.....  ..ooobbbbbboo...  .obbbhbbhbbbo...  .obbbbbbbbbbbo..  .obbbbbbbbbbso..  ..ooooooooooo...`);
  def('egg', `......oooo......  .....obbhbo.....  ....obbhbbbo....  ....obbbbbbo....  ....obbbbbbo....  ....obbbbbso....  .....obbbsso....  ......oooo......`);
  def('bottle', `.....oooo.......  .....obbo.......  .....obbo.......  ....obbbbo......  ...obbhbbbo.....  ...obbbbbbo.....  ...obbbbbbo.....  ...obbbbbso.....  ....oooooo......`);
  def('wool', `...ooo.ooo.oo....  ..obbooobbobbo...  .obbbbbbbbbbbo...  .obhbbbbbbbbso...  ..obbbbbbbbbso...  ..obbbbbbbsso....  ...ooooooooo.....`);

  /* ---------- Crafting / machines ---------- */
  def('barrel', `...oooooooooo...  ..obbbbbbbbbbo..  ..ommmmmmmmmmo..  ..obbhbbbbbbso..  ..obbhbbbbbbso..  ..ommmmmmmmmmo..  ..obbhbbbbbbso..  ..obbbbbbbbsso..  ...oooooooooo...`);
  def('jar', `....oooooo......  ....obbbbo......  ...ommmmmmo.....  ..oocccccoo.....  .occhcbcbcco....  .occcbcbcccco...  .occbcbcbccco....  .occcccccccco....  ..oooooooooo.....`);
  def('hive', `....oooooo......  ...obbbbbbo.....  ..obhbbbbbbo....  ..oyyyyyyyyo....  ..obbbbkkbbo....  ..oyyyyyyyyo....  ..obbbbbbbso....  ..obbbbbbbso....  ..oooooooooo....`);
  def('furnace', `..oooooooooooo..  .oMmmmmmmmmmMo.  .oMmMMMMMMMmMo.  .oMmMkkkkkMmMo.  .oMmMkrykrMmMo.  .oMmMkyrkyMmMo.  .oMmMMMMMMMmMo.  .oMmmmmmmmmmMo.  ..oooooooooooo..`);
  def('chest', `..oooooooooooo..  .obbbbbbbbbbbo.  .obbhbbbbbbhbo.  .ommmmmyymmmmo.  .obbbbbyybbbbo.  .obbbbbbbbbbso.  .obbbbbbbbbsso.  ..oooooooooooo..`);
  def('fence', `................  .oo..oo..oo.....  .nno.nno.nno....  .nnoonnoonno....  .nnnnnnnnnnn....  .nnoonnoonno....  .nnnnnnnnnnn....  .nno.nno.nno....  .oo..oo..oo.....`);
  def('torch', `.......yy.......  ......yrry......  ......yrry......  .......yy.......  ......nnnn......  ......nnnn......  ......nnnn......  ......nnnn......  ......nnnn......  .......oo.......`);
  def('bomb', `..........y.....  .........yry....  ........nn......  .....ooonoo.....  ...ooMMMMMoo...  ..oMmmMMMMMMo...  .oMmhMMMMMMMo...  .oMMMMMMMMMso...  .oMMMMMMMMsso...  ..ooMMMMMsso....  ....ooooooo.....`);
  def('totem', `.....oooooo.....  ....obbbbbo.....  ...obwkbwkbo....  ...obbbbbbbo....  ....obaaabo.....  ....obbbbbo.....  ...obbbbbbbo....  ...obwkbwkbo....  ...obbbbbbbo....  ..ooooooooooo...`);
  def('sprinkler', `.......cc.......  ..c...cc...c...  ...c..cc..c....  ....c.cc.c.....  .....ooooo......  ....oMmmMo......  ....oMmmMo......  ....oMmmMo......  .....ooooo......`);
  def('scarecrow', `....oooooooo....  ...ottttttto...  ..oooooooooooo..  ....owkbkwo.....  ....obbbbbo.....  ..nnnbbbbbnnn...  .nn..bbbbb..nn..  .....bbbbb.......  .....nnnnn.......  ......nnn........  ......nnn........`);
  def('box', `................  ..oooooooooooo..  .obbbbbbbbbbbbo.  .obhhhbbbbbbbbo.  .obbbbbbbbbbbbo.  .obbbbbbbbbbbbo.  .obbbbbbbbbbsso.  .obbbbbbbbbssso.  ..oooooooooooo..`);
  def('bag', `.....oooooo.....  ....obbbbbo....  .....oyyyo.....  ....obbbbbo....  ...obbhbbbbo...  ..obbhbbbbbbo..  ..obbbbbbbbso..  ..obbbbbbbsso..  ...oooooooooo..`);
  def('gift', `....oo...oo.....  ...orrooorro....  ....orrrrro.....  ..oooooyoooooo..  .obbbbbyybbbbbo.  .obbbbbyybbbbbo.  .oyyyyyyyyyyyyo.  .obbbbbyybbbbso.  .obbbbbyybbbbso.  ..oooooooooooo..`);

  /* ---------- Animals ---------- */
  def('chicken', `.......rr.......  ......orro......  .....obbbo......  ....obwkbbo.....  ....obbbyyo.....  ....oobbbo......  .....obbbbbo.....  ....obbbbbbbo....  ...obbhbbbbbbo...  ...obbbbbbbbso...  ....obbbbbbso....  .....ooyyoyyo....  ........y.y.....`);
  def('duck', `.....ooooo.......  ....obbbbbo......  ....obwkbbo......  ....obbbbyyyo....  ....oobbbbo......  .....obbbbbo.....  ...oobbbbbbbo....  ..obbbhbbbbbbo...  ..obbbbbbbbbso...  ...obbbbbbbso....  ....ooooooo......  .....yy.yy.......`);
  def('rabbit', `....oo..oo......  ...obbo.obbo....  ...obpo.obpo....  ...obbooobbo....  ....obbbbbo.....  ....obwkbwko....  ....obbbbbbo....  ...obbbhbbbbo...  ..obbbbbbbbbbo..  ..obbbbbbbbbso..  ...oooooooooo...  ....oo....oo....`);
  def('cow', `.o..........o...  .ok........ko..  ..oooooooooooo..  ..obbbbbbbbbbo..  .obkkbbbbbkkbo..  .obkkbbbbbbbbo..  oobbbbbbbbbbbboo  obwkbbbbbbbbbbbo  obbbbbbkkbbbbbbo  oppppbbbkkbbbbso  .ooobooooooobo..  ...oo......oo...`);
  def('sheep', `....ooooooooo.....  ...owwwwwwwwwo....  ..owwhwwwwwwwwo...  .owwwwwwwwwwwwwo..  .owwwwwwwwwwwwwo..  oooowwwwwwwwwooo.  obbobbbbbbbbbobb.  obwkb.oo.oo.oobbo..`);
  def('pig', `..oo......oo....  .opo......opo...  ..oooooooooo....  .obbbbbbbbbbo...  obbwkbbbbbwkbo..  obbbbbbbbbbbbbo.  obbbbpppppbbbbo.  obbbbpkpkpbbbbo.  .obbbbpppbbbbo..  ..oooooooooooo..  ...oo......oo....`);
  def('ostrich', `......oooo......  .....obbbo......  .....obwkb.o.....  .....obbbbyyo....  ......obbo.......  ......obbo.......  ....oobbbbbbo....  ...obbbbbbbbbo...  ...obbhbbbbbbo...  ....obbbbbbbo....  .....ooyyooyy....  ........y..y.....`);
  def('dino', `.....oooooo......  ....obbbbbbo.....  ...obbwkbbbbo....  ...obbbbbbbboo...  ...obbbbooobbbo..  ....ooobbbbbbo...  ....obbbbbbbso...  ...obbhbaabbbso..  ..obbbbbbbbbbso..  ..oooobbbbbsooo..  .....ooo.oo......`);
  def('horse', `.....oo.oo.......  ....obbobbo......  ....obbbbbbo.....  ...obwkbbbbbo....  ...obbbbbbbbbo...  ....oobbbbbbo....  ...oobbbbbbbbo...  ..obbbhbbbbbbbo..  ..obbbbbbbbbbbo..  ..ooobbbbbbbooo..  ...obo.obo.obo...  ...ooo.ooo.ooo...`);
  def('paw', `...oo.oo.oo.....  ..obbobbobbo....  ..obbobbobbo....  ...oo.oo.oo.....  ...ooobbbooo.....  ..obbbbbbbbbo....  .obbbbbbbbbbbo...  .obbbbbbbbbbbo...  ..oobbbbbbboo....`);

  /* ---------- Monsters ---------- */
  def('slime', `................  ................  .....oooooo.....  ...ooobbbboo....  ..obbhhbbbbbo...  .obbbhbbbbbbbo..  .obbwkbbwkbbbo..  .obbbbbbbbbbbo..  .obbbbbaabbbso..  .oobbbbbbbbsso..  ..oooooooooooo..`);
  def('bat', `..oo........oo..  .obbo.oo.obbo..  obbbbooooobbbbo.  obbbobbbbobbbbo.  .obbobwkwkbobbo.  ..oooobbbboooo..  .....obbbbo.....  ......o..o......`);
  def('ghost', `....oooooooo....  ..ooobbbbbboo..  .obbbbbbbbbbbo..  .obbwkbbbwkbbo..  .obbwkbbbwkbbo..  .obbbbbookbbbo..  .obbbbbbbbbbbo..  .obbbbbbbbbbso..  .obbobbobbobbo..  ..oo.oo.oo.oo...`);
  def('skeleton', `....oooooooo....  ...owwwwwwwwo...  ..owwkkwwkkwwo..  ..owwkkwwkkwwo..  ..owwwwkkwwwwo..  ...owowowowo....  ....owwwwwwo....  ..ooowwwwwwooo..  ..owowwwwwwowo..  ...o.owwwwo.o...  .....owowo......  .....oo.oo......`);
  def('bug', `..o........o....  ...o..oo..o.....  ....oobbbboo....  ...obbhhbbbbo...  ..obwkbbbwkbbo..  ..obbbbbbbbbbo..  ...obbaabbaabo...  ..o.obbbbbbo.o..  .o..o.oooo.o..o.`);
  def('serpent', `....oooo........  ...obbbbo.......  ...obwkbbo.......  ...obbbbbbo......  ....oobbbbbo.....  .....ooobbbbo....  ..o....oobbbbo...  .obo.....obbbo...  .obbooooooobbo...  ..obbbbbbbbbbo...  ...oooooooooo....`);
  def('spirit', `.....oo..oo.....  ....obbooobbo...  ...obbbbbbbbbo..  ...obwkbbbwkbo..  ...obbbbbbbbbo..  ....obbbbbbbo...  .....oobbbboo...  ......o..o.o....`);

  /* ---------- Places, buildings, UI ---------- */
  def('barn', `.......oo.......  .....oorroo.....  ...oorrrrrroo...  .oorrrrrrrrrroo.  .orrrrrrrrrrrro.  .obbbbbbbbbbbbo.  .obbwwwwwwwwbbo.  .obbwoooooowbbo.  .obbwo.xx.owbbo.  .obbwoxxxxowbbo.  .obbwoooooowbbo.  .oooooooooooooo.`);
  def('coop', `.......oo.......  .....ooggoo.....  ...ooggggggoo...  .ooggggggggggoo.  .obbbbbbbbbbbbo.  .obbbwwwwwwbbbo.  .obbbwooooobbbo.  .obbbwoyyyobbbo.  .obbbwooooobbbo.  .oooooooooooooo.`);
  def('house', `......oooooo....  ....ooRRRRoo....  ..ooRRRRRRRRoo..  .oRRRRRRRRRRRRo.  .obbbbbbbbbbbbo.  .obbwwbbbbwwbbo.  .obbwwbbbbwwbbo.  .obbbbbooobbbbo.  .obbbbboyoobbbo.  .oooooooooooooo.`);
  def('silo', `.....oooooo.....  ...ooMMMMMoo...  ..oMmmMMMMMMo...  ..oMmMMMMMMMo...  ..obbbbbbbbbo...  ..obbhbbbbbso...  ..obbhbbbbbso...  ..obbbbbbbbso...  ..obbbbbbbsso...  ..obbbbbbbsso...  ..oooooooooooo..`);
  def('well', `....oooooooo....  ...onnnnnnno...  ..onnnnnnnnno..  ...on....no....  ...on.cc.no....  ..ooMMMMMMMoo...  ..oMmmmmmmmMo...  ..oMmMMMMMmMo...  ..ooooooooooo...`);
  def('obelisk', `.......oo.......  ......obbo......  ......obbo......  .....obbhbo.....  .....obbhbo.....  ....obbhbbbo....  ....obbhbbbo....  ...obbbhbbbbo...  ...obbbbbbbso...  ..ooooooooooo...`);
  def('mill', `.o......o.......  ..oo..oo........  ...ooMoo........  ....oMMo........  ..ooMmmMooo.....  ..oMmmmmMMMo....  ..obbbbbbbbo....  ..obbhbbbbbo....  ..obbwwbbbbo....  ..obbwwbbbbo....  ..oooooooooo....`);
  def('pond', `................  ...ooooooooo....  ..occchcccccco...  .occcccccccccco..  .occcbcccccccco..  .occcccccbcccco..  ..occcccccccco...  ...oooooooooo....  .......ccc.......`);
  def('mountain', `.......oo........  ......owwo.......  .....owwbbo......  ....obbbbbbo.....  ...obbhbbbbbo....  ..obbhbbbbbbbo...  .obbbbbbbbbbbbo..  obbbbbbbbbbbbbbo.  oooooooooooooooo.`);
  def('cave', `....ooooooo.....  ..ooMMMMMMMoo...  .oMmmmmmmmmMo...  oMmmoooooommMo..  oMmoo....oommMo..  oMmo......ommMo..  oMmo......ommMo..  oooo......oooooo.`);
  def('palm', `.gg..gGGg..gg....  ..gggggGgggg.....  ....gggggg.......  ..ggg.nn.ggg.....  .gg...nn...gg....  ......nn.........  ......nn.........  ......nn.........  ...yyyyyyyyyyy...`);
  def('flag', `.nn..............  .nnrrrrrrrrr.....  .nnrrrrrrrrrr....  .nnrrrwrrwrrr....  .nnrrrrrrrrrr....  .nnrrrrrrrrr.....  .nn..............  .nn..............  .nn..............  .nn..............`);
  def('trophy', `..oooooooooooo..  .oyyyyyyyyyyyyo.  oyoyyyhhyyyyyoyo  oyoyyyhyyyyyyoyo  .ooyyyyyyyyyoo...  ....oyyyyyyo....  .....oyyyyo.....  ......oyyo......  .....oyyyyo.....  ....oyyyyyyo....  ...oooooooooo...`);
  def('key', `...ooooo........  ..oyyyyyo.......  .oyyooyyyo......  .oyo..oyyo......  .oyyooyyyo......  ..oyyyyyo.......  ...oyyyo........  ....oyyo........  ....oyyo........  ....oyyyyo......  ....oyyo........  ....oyyyyyo.....  .....ooooo......`);
  def('questmark', `..oooooooooooo..  .oyyyyyyyyyyyyo.  .oyyyykkkkyyyyo.  .oyyykkyykkyyyo.  .oyyyyyyykkyyyo.  .oyyyyyykkyyyyo.  .oyyyyykkyyyyyo.  .oyyyyyyyyyyyyo.  .oyyyyykkyyyyyo.  .oyyyyyyyyyyyyo.  ..oooooooooooo..`);
  def('sun', `.......yy.......  ..y....yy....y.  ...y.oooooo.y...  ....ooyyyyoo....  y..oyyywyyyyo..y  yy.oyyyyyyyyo.yy  y..oyyyyyyyyo..y  ....ooyyyyoo....  ...y.oooooo.y...  ..y....yy....y..  .......yy.......`);

  /* ---------- colour helpers ---------- */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
  const light = (c) => mix(c, '#ffffff', 0.4), dark = (c) => mix(c, '#000000', 0.28), outline = (c) => mix(c, '#1c1008', 0.72);
  const hsl = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return toHex([f(0) * 255, f(8) * 255, f(4) * 255]); };
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const FIXED = { w: '#fdfdfd', k: '#241a16', g: '#5aa83c', G: '#3a7a2a', n: '#8a5a2c', N: '#5a361a', m: '#c4ccd4', M: '#7e8a96', y: '#f2c63a', r: '#d24a3a', R: '#b0402e', p: '#f0a0b8', c: '#6ab4e0', t: '#e8c98a', x: '#2a1c12' };

  /* ---------- colour dictionaries (original palettes chosen per item) ---------- */
  const COL = {
    // crops / forage
    parsnip: '#f0e0b0', 'green bean': '#6ab04a', cauliflower: '#f4f0e0', potato: '#c8a060', garlic: '#f0eadc', kale: '#3f8a3a', rhubarb: '#d84a6a', strawberry: '#e0384a', carrot: '#f08a2a', tulip: '#f06a8a', 'blue jazz': '#5a8aea', rice: '#f0ecd0', 'coffee bean': '#6a4028', blueberry: '#4a5ad0', corn: '#f4d23a', hops: '#9ac84a', 'hot pepper': '#d8302a', melon: '#9ad46a', poppy: '#e8402a', radish: '#d8506a', 'red cabbage': '#9a3a8a', starfruit: '#f4c43a', 'summer spangle': '#f4a030', 'summer squash': '#e8c83a', sunflower: '#f4c820', tomato: '#e03a2a', wheat: '#e8c050', amaranth: '#b02a6a', artichoke: '#7aa05a', beet: '#a82a5a', 'bok choy': '#6ab04a', broccoli: '#3a8a3a', cranberries: '#c8203a', eggplant: '#6a2a8a', 'fairy rose': '#f0a0d0', grape: '#7a3aa8', pumpkin: '#f08a1a', yam: '#c8703a', 'sweet gem berry': '#d84ac8', powdermelon: '#8ad0d0', 'ancient fruit': '#9a5ad0', 'cactus fruit': '#d8508a', pineapple: '#f0c02a', 'taro root': '#9a7aa0',
    apple: '#d8302a', apricot: '#f4a040', cherry: '#c0182a', orange: '#f48a1a', peach: '#f4a080', pomegranate: '#b8202a', banana: '#f4d83a', mango: '#f4a02a', 'tea leaves': '#6a9a3a',
    'wild horseradish': '#d8d8b0', daffodil: '#f4d83a', leek: '#9ac870', dandelion: '#f4e040', 'spring onion': '#a8d870', salmonberry: '#f08a4a', morel: '#9a7a50', 'spice berry': '#d83a4a', 'sweet pea': '#e8a0e8', 'fiddlehead fern': '#5aa03a', 'red mushroom': '#d83a3a', 'common mushroom': '#c8a878', 'wild plum': '#7a3a8a', hazelnut: '#9a6a3a', blackberry: '#3a2a6a', chanterelle: '#f0a02a', 'winter root': '#b08a5a', 'crystal fruit': '#8adcf0', 'snow yam': '#e8e0f0', crocus: '#b08ae8', holly: '#2a8a3a', 'cave carrot': '#d88a3a', 'purple mushroom': '#9a4ad0', coconut: '#8a5a3a', 'nautilus shell': '#f0d0b0', coral: '#f07a6a', 'sea urchin': '#6a3a8a', clam: '#e8d0b8', cockle: '#e0c8a8', mussel: '#3a4a7a', oyster: '#c8c0b0', seaweed: '#3a8a4a',
    // gems / minerals
    diamond: '#c8f0ff', emerald: '#2ac85a', ruby: '#e02a4a', amethyst: '#a04ad8', topaz: '#f4a82a', aquamarine: '#4ac8d8', jade: '#4ab88a', quartz: '#f0f0f8', 'earth crystal': '#8a6a3a', 'frozen tear': '#8ad8f8', 'fire quartz': '#f06a2a', 'prismatic shard': '#f08ae8',
    // fish
    anchovy: '#6a8ab0', sardine: '#8aa0b8', herring: '#7a98b0', tuna: '#4a6aa0', 'red snapper': '#e0503a', 'red mullet': '#e06a5a', pufferfish: '#f0c84a', octopus: '#c84a5a', squid: '#d86a7a', 'sea cucumber': '#6a8a4a', 'super cucumber': '#5aa85a', eel: '#4a6a4a', albacore: '#7a90b0', halibut: '#a89070', sandfish: '#d8b070', 'scorpion carp': '#c89a50', bream: '#a0905a', catfish: '#7a6a5a', chub: '#8a9a6a', dorado: '#e0a02a', carp: '#9aa05a', 'largemouth bass': '#6a9a5a', lingcod: '#7a8a6a', perch: '#8aa04a', pike: '#6a8a5a', 'rainbow trout': '#e08aa0', salmon: '#e87a6a', shad: '#a8b0b8', 'smallmouth bass': '#7aa05a', sturgeon: '#6a7a8a', sunfish: '#f4b02a', 'tiger trout': '#c8a04a', walleye: '#a8a050', woodskip: '#8a7a4a', bullhead: '#7a6a4a', tilapia: '#c0a898', ghostfish: '#c8d8e8', stonefish: '#8a7a6a', 'ice pip': '#a8e0f0', 'lava eel': '#f06a2a', slimejack: '#5aca6a', 'void salmon': '#5a2a8a', 'midnight carp': '#3a4a8a', blobfish: '#e8a8a0', 'midnight squid': '#4a3a8a', 'spook fish': '#b8a8e0', lionfish: '#e0803a', 'blue discus': '#3a8ae0', stingray: '#8a98a8', 'mutant carp': '#9ad83a', crimsonfish: '#d8203a', angler: '#6a5a3a', legend: '#4ab0e0', glacierfish: '#a8e0f8', lobster: '#d84a3a', crab: '#e07a4a', shrimp: '#f0907a', snail: '#b89a6a', periwinkle: '#8a7aa0', crayfish: '#c8503a',
  };
  const TEMPLATE_BY_NAME = [
    // [category|*, regex, template]
    ['fish', /eel/i, 'eel'], ['fish', /ray\b/i, 'ray'], ['fish', /squid|octopus/i, 'squid'], ['fish', /puffer|blobfish|lionfish/i, 'puffer'], ['fish', /legend|angler|crimson|glacier|mutant|midnight carp/i, 'fish'], ['fish', /.*/, 'fish'],
    ['critter', /crab|lobster|crayfish|shrimp/i, 'crab'], ['critter', /.*/, 'shell'],
    ['forage', /mushroom|morel|chanterelle/i, 'mushroom'], ['forage', /clam|cockle|mussel|oyster|shell|urchin|coral/i, 'shell'], ['forage', /nut|coconut/i, 'nut'], ['forage', /berry|plum|grape|fruit|blackberry/i, 'berry'],
    ['forage', /daffodil|dandelion|crocus|pea|holly/i, 'flower'], ['forage', /root|yam|carrot|horseradish|onion|leek/i, 'root'], ['forage', /.*/, 'leaf'],
    ['crop', /parsnip|carrot|radish|beet|yam|potato|taro/i, 'root'], ['crop', /garlic|cauliflower|onion/i, 'bulb'], ['crop', /kale|bok choy|broccoli|amaranth|artichoke|rhubarb|hops|tea/i, 'leaf'],
    ['crop', /bean|pea\b/i, 'bean'], ['crop', /wheat|rice|corn/i, 'grain'], ['crop', /pumpkin|squash|melon|powder|pineapple/i, 'gourd'], ['crop', /berry|cranberr|grape|blueberr|coffee/i, 'berry'],
    ['crop', /tulip|jazz|poppy|spangle|sunflower|rose/i, 'flower'], ['crop', /.*/, 'round'],
    ['tree', /tea/i, 'leaf'], ['tree', /.*/, 'tree'],
    ['mineral', /quartz|crystal|tear|shard|ghost crystal/i, 'crystal'], ['mineral', /diamond|emerald|ruby|amethyst|topaz|aquamarine|jade|opal|stone$|jasper|celestine|tigerseye/i, 'gem'],
    ['mineral', /(.*)/, 'rock'],
    ['artifact', /scroll|note/i, 'scroll'], ['artifact', /bone|skull|rib|tibia|scapula|vertebra|hand|tail|flute|fossil\b(?!.*nautilus)/i, 'bone'], ['artifact', /disc|doll|mask/i, 'disc'], ['artifact', /trilobite|nautilus|palm|amphibian|fossil|starfish|shell/i, 'trilobite'],
    ['artifact', /sword|spur|cog|spoon|ring|jewelry|helm|gadget|handaxe|tool|stick|anchor|egg|seed|statue/i, 'disc'], ['artifact', /.*/, 'vase'],
    ['tool', /pickaxe/i, 'pickaxe'], ['tool', /axe/i, 'axe'], ['tool', /hoe/i, 'hoe'], ['tool', /watering/i, 'can'], ['tool', /rod/i, 'rod'], ['tool', /scythe/i, 'scythe'], ['tool', /pan/i, 'pan'], ['tool', /pail/i, 'pail'], ['tool', /shear/i, 'shears'], ['tool', /.*/, 'pickaxe'],
    ['weapon', /dagger|knife|dirk|shank|kris|spire|blade$/i, 'dagger'], ['weapon', /club|bat|hammer|mallet|slammer|femur|rod\b/i, 'club'], ['weapon', /.*/, 'sword'],
    ['gear', /ring|band/i, 'ring'], ['gear', /boots|shoes|sneakers/i, 'boot'], ['gear', /.*/, 'ring'],
    ['recipe', /soup|stew|chowder|curry|hotpot|bisque|broth|risotto|medley|salad|ravioli|pudding|pot/i, 'bowl'], ['recipe', /cake|bar|tart|candy|muffin|cookie/i, 'cake'], ['recipe', /pie/i, 'pie'], ['recipe', /colada|tea|coffee|juice|beer|wine|ale/i, 'drink'],
    ['recipe', /bread|bun|tortilla|pancake/i, 'bread'], ['recipe', /egg|omelet/i, 'egg'], ['recipe', /.*/, 'plate'],
    ['craft', /keg|barrel|cask/i, 'barrel'], ['craft', /jar|preserve/i, 'jar'], ['craft', /bee/i, 'hive'], ['craft', /furnace|kiln|smelt/i, 'furnace'], ['craft', /chest|storage/i, 'chest'], ['craft', /fence|gate|path/i, 'fence'], ['craft', /torch|light/i, 'torch'],
    ['craft', /bomb/i, 'bomb'], ['craft', /totem/i, 'totem'], ['craft', /sprinkler/i, 'sprinkler'], ['craft', /scarecrow/i, 'scarecrow'], ['craft', /fertilizer|bait|pot|seed|crab pot/i, 'bag'], ['craft', /.*/, 'box'],
    ['animal', /chicken/i, 'chicken'], ['animal', /duck/i, 'duck'], ['animal', /rabbit/i, 'rabbit'], ['animal', /cow/i, 'cow'], ['animal', /goat|sheep/i, 'sheep'], ['animal', /pig/i, 'pig'], ['animal', /ostrich/i, 'ostrich'], ['animal', /dino/i, 'dino'], ['animal', /horse/i, 'horse'], ['animal', /.*/, 'paw'],
    ['monster', /slime|sludge|jelly/i, 'slime'], ['monster', /bat/i, 'bat'], ['monster', /ghost/i, 'ghost'], ['monster', /skeleton/i, 'skeleton'], ['monster', /bug|grub|fly/i, 'bug'], ['monster', /serpent|rex/i, 'serpent'], ['monster', /spirit|sprite|shadow|dust/i, 'spirit'], ['monster', /crab/i, 'crab'], ['monster', /.*/, 'slime'],
    ['building', /barn|stable/i, 'barn'], ['building', /coop/i, 'coop'], ['building', /silo/i, 'silo'], ['building', /well/i, 'well'], ['building', /obelisk|clock/i, 'obelisk'], ['building', /mill/i, 'mill'], ['building', /pond/i, 'pond'], ['building', /.*/, 'house'],
    ['area', /island|volcano|desert/i, 'palm'], ['area', /mine|skull|cave|sewer|lair|woods|swamp|quarry/i, 'cave'], ['area', /.*/, 'mountain'],
    ['bundle', /.*/, 'bag'], ['festival', /.*/, 'flag'], ['quest', /.*/, 'scroll'], ['achievement', /.*/, 'trophy'], ['secret', /.*/, 'key'], ['npcgift', /.*/, 'gift'],
  ];
  const CAT_BASE = { fish: '#5b8fb9', crop: '#7bbf4e', forage: '#b8a060', mineral: '#a374d1', artifact: '#c9a24d', tool: '#9aa8b8', weapon: '#b0b8c4', gear: '#7a6a9a', recipe: '#d9805a', craft: '#b5835a', animal: '#e8d8c0', monster: '#6fb060', building: '#c05a40', area: '#8c7a6b', bundle: '#e0b040', festival: '#e56fa0', quest: '#e8d098', achievement: '#f0c43a', secret: '#d8b040', tree: '#4f9a4f', critter: '#d4705a', npcgift: '#e56fa0' };
  const ANIMAL_COL = { chicken: '#f4ece0', duck: '#d8b878', rabbit: '#d8c8b8', cow: '#f4f4f0', goat: '#e8e0d0', sheep: '#f4f4ee', pig: '#f0a8a8', ostrich: '#8a7a6a', dino: '#6ab060', horse: '#9a6a3a', slime: '#5aca6a', bat: '#6a4a8a', ghost: '#d8e0f0', skeleton: '#e8e4d8', bug: '#7a9a3a', serpent: '#8a5aa8', spirit: '#3a3a4a', crab: '#d86a4a' };
  const ROOM_COL = { 'crafts room': '#e08a3a', pantry: '#6ab04a', 'fish tank': '#4a8ad0', 'boiler room': '#c8503a', 'bulletin board': '#e0c040', vault: '#d8b030' };
  const WEAPON_COL = { sword: '#d0d8e0', dagger: '#c8d0d8', club: '#8a5a2a' };

  function pickColor(name, cat, tpl) {
    const k = name.toLowerCase().replace(/ \(.*\)/, '');
    if (cat === 'bundle') { const r = Object.keys(ROOM_COL).find((x) => k.includes(x)); if (r) return ROOM_COL[r]; }
    if (COL[k]) return COL[k];
    const word = Object.keys(COL).find((c) => c.length > 3 && k.includes(c)); if (word) return COL[word];
    if (ANIMAL_COL[tpl] && (cat === 'animal' || cat === 'monster')) return ANIMAL_COL[tpl];
    if (cat === 'weapon') return WEAPON_COL[tpl];
    if (cat === 'mineral' || cat === 'artifact' || cat === 'recipe' || cat === 'craft' || cat === 'fish' || cat === 'critter' || cat === 'forage' || cat === 'crop' || cat === 'gear' || cat === 'monster') {
      const h = hash(k) % 360; const sat = cat === 'mineral' ? 28 : 48; return hsl(h, sat, cat === 'artifact' ? 52 : 58);
    }
    return CAT_BASE[cat] || '#b5835a';
  }
  function pickTemplate(name, cat) {
    const n = name.toLowerCase();
    for (const [c, re, t] of TEMPLATE_BY_NAME) if ((c === cat) && re.test(n)) return t;
    return 'box';
  }

  /* ---------- rendering ---------- */
  const cache = {};
  function draw(tpl, base, accent) {
    const rows = T[tpl] || T.box; const W = 16, H = 16;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length, ox = Math.floor((W - w) / 2), oy = Math.max(0, Math.floor((H - h) / 2));
    const pal = { b: base, h: light(base), s: dark(base), o: outline(base), a: accent || dark(base), ...FIXED };
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = ch === 'R' && !(tpl === 'house' || tpl === 'barn') ? pal.R : pal[ch] || base; g.fillRect(ox + x, oy + y, 1, 1); } });
    // house roof colour should follow the base
    return c.toDataURL();
  }
  const ACCENTS = { fish: (b) => mix(b, '#ffffff', 0.55), crop: (b) => dark(b), recipe: (b) => mix(b, '#7a4a20', 0.45), mineral: (b) => mix(b, '#ffffff', 0.3) };
  const S = (SDV.sprites = {});
  S.templates = T;
  S.get = (name, cat) => {
    const key = cat + '|' + name; if (cache[key]) return cache[key];
    let tpl = pickTemplate(name, cat); const base = pickColor(name, cat, tpl);
    const acc = (ACCENTS[cat] || ((b) => mix(b, '#ffffff', 0.35)))(base);
    if (tpl === 'house' || tpl === 'barn' || tpl === 'coop') { /* roof uses fixed R */ }
    return (cache[key] = draw(tpl, base, acc));
  };
  S.drawRaw = draw;
  S.img = (name, cat, cls = '') => `<img class="spr ${cls}" src="${S.get(name, cat)}" alt="" width="16" height="16" aria-hidden="true">`;
})();
