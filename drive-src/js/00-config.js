/* ======================= config: everything a presenter edits ======================= */
/* one line per person: [race number, name, team, colour, model file, model yaw]
   model file is optional — a .glb in drive-src/assets/ (copied to assets/ by the
   build); without one the drawn box car is used. yaw turns a model that faces
   the wrong way (in quarter turns: 2 = half turn). */
const people=[
  ['03','Aarav Mehta','Engineering','#2E9BE0','pixar_cars_series_lightning_mcqueen.glb',2],
  ['07','Priya Nair','Design','#3EC7C2','sally__disney-pixar_cars.glb',2],
  ['12','Rohan Iyer','Product','#F5B335','cars_2_the_videogame_-_the_king.glb',2],
  ['14','Sneha Kulkarni','QA','#8E5BD6','lizzie.glb',2],
  ['19','Vikram Rao','Sales','#E23A2E','cars_2_the_video_game_-_chick_hicks_purple_rage.glb',2],
  ['22','Ananya Sharma','Marketing','#FF5CA8','tokyo_mater.glb',2],
  ['27','Karthik Menon','Support','#6CC04A','cars_2_the_videogame_-_custom_disney_100_doc.glb',2],
  ['30','Meera Pillai','Data','#C9CFDD','cars_2_the_videogame_-_disney_100_custom_ramone.glb',2]];
const CREAM='#F3E7CF';
const SHOW={
  board:'HAPPY BIRTHDAY, AUGUST',
  boardSub:'POPULATION: EIGHT MORE THAN YESTERDAY',
  race:'THE AUGUST 500',
  scrawl:'everyone finished first · august 2026',
  credits:[['made with love and questionable life choices by','Kavya'],['built on code, coffee and zero sleep by','Arokia Lijas']],
  video:'Landing Video.mp4',
  attractTitle:'20 YEARS OF CARS',
  attractSub:'route 08 · the august detour',
  /* roadside scenery models: x/z position, ry in quarter turns, size = width */
  props:[
    {file:'fatboys_diner.glb',x:-15,z:-463,ry:1,size:13},
    {file:'gas_station_props.glb',x:-15.5,z:-570,ry:1,size:14},
    /* desert dressing along the highway drive */
    {id:'cliff1',file:'free_stylized_cliff_rock.glb',x:-34,z:-150,size:24},
    {id:'cliff2',file:'free_stylized_cliff_rock.glb',x:38,z:-280,ry:2,size:30},
    {id:'cliff3',file:'free_stylized_cliff_rock.glb',x:-42,z:-360,ry:1,size:20},
    {id:'cliff4',file:'free_stylized_cliff_rock.glb',x:-48,z:-900,ry:3,size:34},
    {id:'hills1',file:'low_poly_rocks_hills_trees.glb',x:34,z:-170,size:46},
    {id:'hills2',file:'low_poly_rocks_hills_trees.glb',x:-38,z:-250,ry:2,size:52},
    /* skyline closing the vista at the end of main street */
    {id:'cityL',file:'chicago_buildings.glb',x:-24,z:-662,size:42},
    {id:'cityR',file:'chicago_buildings.glb',x:24,z:-676,ry:2,size:42}]};
