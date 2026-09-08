/* ======================= config: everything a presenter edits ======================= */
/* one line per person: [race number, name, label, colour, model file, model yaw, photo]
   the label sits under the name (their birthday). model files are a pool:
   every .glb named here (in drive-src/assets/, copied to assets/ by the
   build) is shuffled across the whole field on each load, so nobody is
   assigned a particular car on purpose. yaw turns a model that faces the
   wrong way (in quarter turns: 2 = half turn). photo is optional — a file in
   drive-src/assets/photos/ (any size; the pit-stop loader fetches it). */
const people=[
  ['01','Denilkumar Gabani','August 1','#E039EF','cars_winford_bradford.glb',2],
  ['02','Pradeep Edwin','August 2','#DDC72C','lizzie.glb',2,'Pradeep Edwin.png'],
  ['03','Abhijit Mandal','August 3','#4D47E1','cars_2_the_videogame_-_disney_100_custom_ramone.glb',2,'Abhijit Mandal.jpg'],
  ['04','Chandrashekar Mahadevaiah','August 5','#50ED1D','cars_2_the_videogame_-_custom_disney_100_doc.glb',2,'Chandru.M.jpeg'],
  ['05','Leenu Tiwari','August 5','#E147DA','cars_2_the_video_game_-_fire_department_fillmore.glb',2],
  ['06','Shashikant Dwivedi','August 8','#39D0EF','cars_2_the_video_game_-_chick_hicks_purple_rage.glb',2],
  ['07','Prashant Sahu','August 8','#E1479A','tokyo_mater.glb',2],
  ['08','Arun Kalimuthu','August 8','#39EF85','lizzie.glb',2,'Arun.jpeg'],
  ['09','Vishnu Vijay','August 15','#A339EF','cars_2_the_videogame_-_the_king.glb',2,'Vijay Vishnu.png'],
  ['10','Pravin Babu','August 15','#47B4E1','cars_2_the_videogame_-_custom_disney_100_doc.glb',2],
  ['11','Ayush Aryan','August 16','#3957EF','sally__disney-pixar_cars.glb',2,'Ayush Aryan.jpeg'],
  ['12','Arjun B','August 16','#EF3984','cars_2_the_videogame_-_disney_100_custom_ramone.glb',2],
  ['13','Arushi','August 18','#47E1DB','disney_infinity_1.0__luigi_updated.glb',2,'Arushi Garg.jpg'],
  ['14','Shivank','August 18','#8DE147','pixar_cars_series_lightning_mcqueen.glb',2,'Shivank.png'],
  ['15','Divya Dahate','August 18','#DD432C','cars_2_the_videogame_-_the_king.glb',2,'Divya Dahate.jpg'],
  ['16','Moulali Naguri','August 18','#5839EF','cars_3_driven_to_win_-_chick-a-licious.glb',2],
  ['17','Tejus Kandachar','August 19','#47E174','sally__disney-pixar_cars.glb',2,'Tejas Kandachar.jpg'],
  ['18','Ashmeet Singh Deol','August 19','#EF7639','cars_2_the_videogame_-_patokaa.glb',2,'Ashmeet.jpeg'],
  ['19','Rohit Kumar','August 19','#1D84ED','cars_2_the_video_game_-_fire_department_fillmore.glb',2,'Rohith Kumar.png'],
  ['20','Sakthi Gunasekaran','August 19','#ED1DB8','suzuki_carry_blind_van.glb',2],
  ['21','Thinesh S','August 20','#2CDD9B','cars_3_driven_to_win_-_chick-a-licious.glb',2,'Thinesh.png'],
  ['22','Angel Yadav','August 20','#EFB339','cars_manny_flywheel.glb',2],
  ['23','Madhu Babu Kalapala','August 20','#1DEDB9','max_schnell.glb',2,'Madhu Babu Kalapala.jpg'],
  ['24','Siddharth Singh','August 21','#E14767','cars_2_the_videogame_-_pitty.glb',2],
  ['25','Vismaya Jagadish','August 21','#B1EF39','cars_2_the_videogame_-_pitty.glb',2,'Vismaya.jpeg'],
  ['26','Gary Ames','August 21','#1DEDED','disney_infinity_1.0__luigi_updated.glb',2,'Gary.jpeg'],
  ['27','Jukur Rani','August 22','#B547E1','cars_2_the_video_game_-_chick_hicks_purple_rage.glb',2,'Rani Jukur.png'],
  ['28','K Sunil Kumar','August 22','#EF3947','cars_2_the_videogame_-_zil.glb',2],
  ['29','Gaurav C','August 23','#E18E47','cars_winford_bradford.glb',2],
  ['30','Mala Dharshini','August 24','#ECED1D','tokyo_mater.glb',2,'Mala Dharshini.jpg'],
  ['31','Shruti Gangavati','August 24','#2C6EDD','cars_2_the_videogame_-_rv_large.glb',2,'Shruti gangappa.jpeg'],
  ['32','Amritanshu Vivek','August 25','#6F2CDD','cars_2_the_videogame_-_zil.glb',2,'Amritanshu Vivek.jpg'],
  ['33','Ashwini K','August 25','#42DD2C','cars_2_the_videogame_-_patokaa.glb',2],
  ['34','Raja Vemula','August 26','#C1E147','max_schnell.glb',2],
  ['35','Sabila Sameer','August 29','#47E168','cars_manny_flywheel.glb',2,'Sabila.jpeg'],
  ['36','Madhukar Bhat','August 30','#ED1D1D','pixar_cars_series_lightning_mcqueen.glb',2,'Madhukar Bhat.jpeg'],
  ['37','Raj Fatnani','August 31','#39EF48','cars_2_the_videogame_-_rv_large.glb',2,'Raj Fatnani.jpg']];
/* anyone without a photo shows this one (also in assets/photos/); with no
   image at all the nameplate keeps the number roundel */
const N=people.length; /* the field: every loop, grid and slot follows the roster */
const CREAM='#F3E7CF';
const SHOW={
  portrait:'mickey.png',
  /* models painted so dark they vanish at night get a little self-light */
  darkCars:['cars_2_the_videogame_-_zil.glb'],
  board:'HAPPY BIRTHDAY, AUGUST',
  boardSub:'POPULATION: THIRTY-SEVEN MORE THAN YESTERDAY',
  race:'THE AUGUST 500',
  scrawl:'everyone finished first · august 2026',
  credits:[['made with love and questionable life choices by','Kavya'],['built on claude, coffee and zero sleep by','Jaws']],
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
