// English place nouns dictionary used by heuristic extractor
// Grouped for readability; export as a single array.

export const PLACE_NOUNS: string[] = [
  // Food & drink
  'cafe','coffee shop','coffeehouse','tea house','teahouse','bar','pub','tavern','restaurant','bistro','brasserie','cantina','pizzeria','steakhouse','sushi bar','noodle shop','diner','cafeteria','canteen','bakery','deli','food court','food truck','brewery','taproom','winery','tasting room','juice bar','ice cream shop','creamery','dessert shop','espresso bar','coffee kiosk','tea shop','bubble tea shop','taco stand','food hall','roastery','brewpub','chophouse','grill','ramen shop','pho shop','sandwich shop','burger joint','cider house','distillery','speakeasy','beer hall',
  // Homes & rooms
  'apartment','flat','condo','home','house','loft','studio apartment','dorm','duplex','penthouse','townhouse','rowhouse','cottage','bungalow','cabin','hut','shack','shed','barn','attic','basement','cellar','pantry','laundry room','utility room','closet','walk-in closet','mudroom','kitchen','bedroom','bathroom','restroom','washroom','toilet','living room','dining room','hallway','corridor','study','home office','guest room','nursery','playroom','sunroom','conservatory','den','family room','rec room','media room','sitting room','parlor','storage room','storeroom','linen closet','cloakroom','powder room','crawlspace','carport','garage','yard','backyard','front yard','courtyard','garden','patio','porch','deck','terrace','veranda','balcony','rooftop','roof','foyer','lobby','entryway','stairwell',
  // Work & services
  'office','workspace','studio','coworking space','workshop','warehouse','factory','plant','lab','laboratory','clinic','urgent care','hospital','doctor\'s office','dental clinic','veterinary clinic','pharmacy','drugstore','bank','post office','city hall','town hall','courthouse','police station','fire station','embassy','consulate','recycling center','data center','research center','construction site','repair shop','service center','call center','headquarters','law office','accounting office','insurance office','real estate office','travel agency','ticket office','rental office','shipping center','mailroom','machine shop','foundry','power plant','water treatment plant','dispatch center','blood bank',
  // Education & culture
  'school','preschool','daycare','classroom','lecture hall','lecture theatre','campus','university','college','library','reading room','archives','museum','gallery','exhibit hall','theater','cinema','auditorium','concert hall','music hall','recital hall','assembly hall','cultural center','community center','art center','science center','stadium','arena','gym','gymnasium','dojo','ring','track','court','field','pitch','playground','schoolyard','observatory','planetarium','student union','student center','training center','makerspace','computer lab','language lab','seminar room','rehearsal room','practice room','playhouse','opera house','black box theater','art studio',
  // Retail & shopping
  'mall','shopping mall','shopping center','store','shop','convenience store','corner store','department store','grocery','supermarket','warehouse store','outlet','bookstore','record store','music store','game store','toy store','electronics store','furniture store','clothing store','shoe store','pet store','hardware store','liquor store','optician','boutique','thrift store','pawn shop','kiosk','market','farm stand','farmer\'s market','fish market','butcher','florist','gift shop','souvenir shop','superstore','big box store','newsstand','marketplace','bazaar','swap meet','antique shop','consignment shop','comic shop','sporting goods store','outdoor store','bike shop','jewelry store','cosmetics store','stationery store','tailor shop',
  // Transport
  'station','train station','railway station','train terminal','subway','metro','underground','platform','bus stop','bus station','bus terminal','tram stop','tram station','light rail station','airport','runway','terminal','harbor','harbour','port','marina','dock','pier','boardwalk','ferry terminal','ferry dock','depot','railyard','rail yard','heliport','helipad','hangar','taxi stand','parking lot','car park','parking garage','park and ride','bike share station','rideshare pickup','garage','subway station','metro station','commuter rail station','freight terminal','cargo terminal','bus depot','coach station','truck stop','border crossing','checkpoint','customs office','immigration hall','ticket booth',
  // Roads & outdoors
  'street','road','avenue','lane','alley','alleyway','boulevard','highway','freeway','motorway','intersection','roundabout','crossroads','sidewalk','pavement','crosswalk','driveway','cul-de-sac','dead end','median','shoulder','bike lane','bike path','cycle path','frontage road','service road','access road','bridge','tunnel','overpass','underpass','trailhead','pullout','scenic overlook','rest area','rest stop','toll booth','toll plaza','gas station','petrol station','service station','plaza','square','promenade','esplanade','walkway','footpath','greenway','on-ramp','off-ramp','ramp','flyover','viaduct','causeway','embankment',
  // Nature
  'park','beach','shore','coast','bay','gulf','lagoon','lake','river','creek','stream','pond','waterfall','marsh','swamp','wetland','bog','fen','delta','estuary','reef','forest','woods','jungle','meadow','field','prairie','savanna','desert','canyon','valley','gorge','ravine','mountain','hill','ridge','summit','pass','cliff','cave','plateau','mesa','dune','oasis','spring','hot spring','glacier','volcano','crater','island','peninsula','cape','camp','campsite','trail','path','waterhole','geyser','garden','nature reserve','wildlife refuge','national park','state park','botanical garden','arboretum','grove','orchard','vineyard','thicket','glade','clearing','brook','bayou','fjord',
  // Lodging & leisure
  'hotel','motel','inn','hostel','bed and breakfast','guesthouse','lodge','resort','spa','club','nightclub','lounge','barbershop','salon','pool','skating rink','ice rink','bowling alley','casino','amusement park','theme park','water park','golf course','mini golf','pool hall','billiard hall','karaoke bar','game room','zoo','aquarium','campground','rv park','boarding house','holiday park','fitness center','yoga studio','dance studio','climbing gym','skate park','driving range','batting cages','shooting range','race track','arcade',
  // Worship
  'church','chapel','cathedral','mosque','temple','synagogue','shrine','monastery','abbey','convent','gurdwara','pagoda','meetinghouse','basilica','stupa','prayer hall','prayer room','sanctuary','tabernacle','worship center','religious center','church hall','ashram',
]

// High recall but ambiguous; only use with nearby context in extractor.
export const AMBIGUOUS_PLACE_NOUNS: string[] = [
  // Generic structures
  'place','spot','area','location','site','setting',
  'space','zone','section','part','side','corner','edge','end',
  'structure','facility','premises','grounds',

  // Buildings & interiors
  'building','room','hall','floor','level','story','storey',
  'suite','unit',
  'workroom',
  'chamber','cell','vault',
  'vestibule',
  'passage',
  'stairs','staircase','landing',
  'elevator','lift',

  // Entrances & transitions
  'entrance','exit','door','doorway','gate','gateway',
  'threshold','archway','passageway',

  // Outdoor / urban
  'way','route',
  'block','lot',
  'green','commons',
  'crossing',
  'junction',

  // Civic / regional (very ambiguous)
  'town','city','village','district','quarter',
  'center','centre','downtown','uptown','midtown',
  'neighborhood','neighbourhood','suburb','suburbs',

  // Travel & transit (short forms)
  'stop','stand',

  // Commerce & public
  'counter','desk',

  // Nature (abstracted)
  'land','terrain','ground',
  'trees',

  // Event / gathering
  'venue',

  // Catch-all conversational
  'here','there','inside','outside','upstairs','downstairs',
  'nearby','around','elsewhere'
]
