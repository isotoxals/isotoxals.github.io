	// ***  Much of this is based on Lee Stemkoski's very helpful examples  ***

// get arg from url, e.g.: '...html?phn=I32b_1'
const Query = window.location.search;
var Item = Query.substring( 5, 50 );   // .replace(/%22/g,'');
Item = Item.replace(/%C2%B1/g,'±');

// standard global variables
var  Container, Renderer, Scene, Camera, Controls;

// custom global variables (accessible to GUI callbacks)
var  Settings, Settings2;

init();
var  This_item = OBJECTS[Item];  // object to display - changed by selection in GUI
if(  This_item == undefined  ){   This_item = OBJECTS.I52c_1;   }

Make_Menus();
Display( This_item ); 
animate();


function  init(){
	// ************* Standard (more or less) ThreeJS setup *************
	var  Screen_width = window.innerWidth, Screen_height = window.innerHeight;
	// RENDERER
	if(  Detector.webgl  ){   Renderer = new THREE.WebGLRenderer( {antialias:true} );   }
		else          {   Renderer = new THREE.CanvasRenderer();                    }
	Renderer.setSize( Screen_width, Screen_height );
	Renderer.setClearColor( 0xcfe7ff );   // background color
	Container = document.getElementById( 'ThreeJS' );
	Container.appendChild( Renderer.domElement );
	// SCENE
	Scene = new THREE.Scene();
	// CAMERA
	Camera = new THREE.PerspectiveCamera( 45, Screen_width / Screen_height, 0.05, 2000);
	Camera.position.set( 260, 200, 140 );
	Camera.lookAt( Scene.position );	
	Camera.up.set( 0, 0, 1 );	
	Scene.add( Camera );
	// EVENTS
	THREEx.WindowResize( Renderer, Camera );
	// CONTROLS
	// better to replace Zoom with Fly...
	Controls = new THREE.TrackballControls( Camera, Renderer.domElement );
	// LIGHTS
	var  Light_a = new THREE.AmbientLight( 0x303030 );
	Scene.add( Light_a );
	var  Light_p1 = new THREE.PointLight( 0xffffff );	Light_p1.position = Camera.position;
	Scene.add( Light_p1 );
	var  Light_p2 = new THREE.PointLight( 0xffffff, 0.4 );	Light_p2.position.set( -200, -200,  200 );
	Scene.add( Light_p2 );
	var  Light_p3 = new THREE.PointLight( 0xffffff, 0.4 );	Light_p3.position.set(  200,  200,  200 );
	Scene.add( Light_p3 );
	}


function  Make_Menus(){
	Settings = {
		Tips  : function(){},    // a clickable button
		Reset : function(){},    // a clickable button
		F1    : { Faces_as : "All Strips",  Highlight : true,  Opacity : 0.9 },
		F2    : { Faces_as : "All Strips",  Highlight : true,  Opacity : 0.9 },
		Comp  : { Faces_as : "All Strips",                     Opacity : 0.9 },
		Model : "Full",
		};

	Opts_menu = new dat.GUI({ hideable: false });
	Opts_menu.add( Settings, "Tips" ).name( "Tips" )
		.onChange( function(value){   alert(
			"Drag the left mouse button to rotate the model.\n"+
			"Use the mouse wheel (or its equivalent) to zoom in and out.\n"+
			"Drag the right mouse button to pan."
			); } )
		;
	Opts_menu.add( Settings, "Reset" ).name( "Reset viewpoint" )
		.onChange( function(value){   Controls.reset();   } )
		;
	var  Type1_opts = Opts_menu.addFolder( "Faces of Type 1" );
	var  Type2_opts = Opts_menu.addFolder( "Faces of Type 2" );
	var  Comp_opts  = Opts_menu.addFolder( "Components"      );
	var  Model_opts = Opts_menu.addFolder( "Model Setting"   );
	// Some options are ignored for single-edge and single-vertex models.

	////// ******************* How much of the Faces to show *******************
	var  Face_states = [ "All Complete", "One Complete", "All Strips", "Hidden" ];
	Type1_opts.add( Settings.F1  , "Faces_as", Face_states ).name( "Faces as" )
		.onChange( function(value){   Display( This_item );   } )
		;
	Type2_opts.add( Settings.F2  , "Faces_as", Face_states ).name( "Faces as" )
		.onChange( function(value){   Display( This_item );   } )
		;
	var  Comp_states = [ "All Complete", "One Complete", "All Strips" ];
	Comp_opts.add(  Settings.Comp, "Faces_as", Comp_states ).name( "Components as" )
		.onChange( function(value){   Display( This_item );   } )
		;

	////// ******************* Face highlighting *******************
	Type1_opts.add( Settings.F1, "Highlight" ).name( "Highlight 1" )
		.onChange( function(value){   Display( This_item );   } )
		;
	Type2_opts.add( Settings.F2, "Highlight" ).name( "Highlight 1" )
		.onChange( function(value){   Display( This_item );   } )
		;

	////// ******************* Transparency *******************
	Type1_opts.add( Settings.F1  , "Opacity",  0.0, 1.0, 0.1 ).name( "Opacity" )
		.onFinishChange( function(value){   Display( This_item );   } )
		;
	Type2_opts.add( Settings.F2  , "Opacity",  0.0, 1.0, 0.1 ).name( "Opacity" )
		.onFinishChange( function(value){   Display( This_item );   } )
		;
	Comp_opts.add(  Settings.Comp, "Opacity",  0.0, 1.0, 0.1 ).name( "Opacity" )
		.onFinishChange( function(value){   Display( This_item );   } )
		;

	////// ******************* Model type selection *******************
	var  Model_types = [ "Full", "Edge", "Vertex, Class A", "Vertex, Class B" ];
	var  Model_sel = Model_opts.add( Settings, "Model", Model_types ).name( "Model Type" )
		.onChange( function(value){   Display( This_item );   } )
		;

	////// ******************* Selection lists *******************
	var  Sel_menu = new dat.GUI({ hideable: false });
	var  Sel_container = document.getElementById('MenuL');
	Sel_container.appendChild( Sel_menu.domElement );

	var  FI_sel   = Sel_menu.addFolder( "Face-Intransitives" );
	var  FT_sel   = Sel_menu.addFolder( "Face-Transitives"   );
	var  Reg_sel  = Sel_menu.addFolder( "Regulars"           );
	var  VT_sel   = Sel_menu.addFolder( "Other Uniforms"     );
	var  Comp_sel = Sel_menu.addFolder( "Compounds"          );
	var  Sel;
	var  Which_sel = {
		"Face-Intransitive" : FI_sel,
		"Face-Transitive"   : FT_sel,
		"Compound"          : Comp_sel,
		"Regular"           : Reg_sel,
		"Vertex-Transitive" : VT_sel,
		}
		
	for(  var Arg  in OBJECTS  ){
		var  P = OBJECTS[Arg];
		var  Categ = P.Category[0];
		Sel = Which_sel[Categ];
		if(  Sel == undefined  ){   Sel = Sel_menu;   }
		Settings[Arg] = function(){};
		Sel.add( Settings, Arg ).name( P.Tag )
			.onChange( function(value){   Switch_to(this.property);   } );
		}

	Sel_menu.open();
	Type1_opts.open();
	Type2_opts.open();
	Comp_opts.open();
	Model_opts.open();
	Vis( This_item );
	Opts_menu.open();
	//////////////////

	//  Visibility of menus
	function  Vis( Item ){
		var  PO = OPTIONS[Item.Tag];
		if(  PO.Type1  == "Y"  ){   Type1_opts.show();   }    else{   Type1_opts.hide();   }
		if(  PO.Type2  == "Y"  ){   Type2_opts.show();   }    else{   Type2_opts.hide();   }
		if(  PO.Comp   == "Y"  ){   Comp_opts.show();    }    else{   Comp_opts.hide();    }
		if(  PO.Models == "Y"  ){   Model_opts.show();   }    else{   Model_opts.hide();   }
		}

	function  Switch_to( Item ){
		This_item = OBJECTS[Item];
		Vis( This_item );
		Display( This_item );			
		}		
	}


var  Structure_mesh;
var  Name_banner;
function  Display( Defn ){
	Scene.remove( Structure_mesh );
	Scene.remove( Name_banner );
	Structure_mesh = Structure_from_Definition( Defn );
	Name_banner = Make_Banner( "  " + Defn.Tag + ":   " + Defn.Name + "  " );
	Name_banner.position.set( window.innerWidth/2, 10, 0 );
	Scene.add( Name_banner );
	Scene.add( Structure_mesh );
	}


function  Structure_from_Definition( Defn ){
	var  Structure = new THREE.Object3D();

	   // Options by Face Type
	var  Opts1 = {
		Show_as : Settings.F1.Faces_as,
		High    : Settings.F1.Highlight,
		Opacity : Settings.F1.Opacity,
		RGB_std : new THREE.Color( 0xdd0000 ),  //  Red    - normal Covering/Outer faces
		RGB_hi  : new THREE.Color( 0x00dd00 ),  //  Green  - 1st highlighted Covering/Outer face
		RGB_hi2 : new THREE.Color( 0x009999 ),  //  Teal   - 2nd highlighted Covering/Outer face  (rare)
		RGB_2nd : new THREE.Color( 0x770022 ),  //  Purple - 2nd normal Covering/Outer face in single-edge models
		}
	var  Opts2 = {
		Show_as : Settings.F2.Faces_as,
		High    : Settings.F2.Highlight,
		Opacity : Settings.F2.Opacity,
		RGB_std : new THREE.Color( 0x0000dd ),  //  Blue - normal Equatorial/Inner faces
		RGB_hi  : new THREE.Color( 0x00dddd ),  //  Cyan - 1st highlighted Equatorial/Inner face
		RGB_hi2 : new THREE.Color( 0x009999 ),  //  Teal - 2nd highlighted Equatorial/Inner face  (not currently supported)
		}
	var  Opts_Comp = {
		Show_as : Settings.Comp.Faces_as,
		Opacity : Settings.Comp.Opacity,
		}
	var  Model_option = Settings.Model;
	   // Force full model for Compounds and the exploded-Vertex model
	if(  OPTIONS[Defn.Tag].Models != "Y"  ){   Model_option = "Full";   }
	   // Ignore Face hightlighting/hiding in single-element models
	Opts1.Faces_single = Opts1.Show_as.replace("One Complete","All Strips").replace("Hidden","All Strips");
	Opts2.Faces_single = Opts2.Show_as.replace("One Complete","All Strips").replace("Hidden","All Strips");

	var  Compound_colors = [ new THREE.Color( 0x000000 ),
		new THREE.Color( 0x00dd00 ),
		new THREE.Color( 0xdd0000 ),
		new THREE.Color( 0x770077 ),
		new THREE.Color( 0x007777 ),
		new THREE.Color( 0x0000dd ),
		new THREE.Color( 0x007700 ),
		new THREE.Color( 0x770000 ),
		new THREE.Color( 0x440044 ),
		new THREE.Color( 0x004444 ),
		new THREE.Color( 0x000077 ),
		];

	// Dimensions
	var  Scaling       = 100;   // overall size - depends on camera position and viewing angle
	var  Sphere_radius = 0.4;   // Vertex sphere
	var  Frame_radius  = 0.2;   // framework Edge cylinder
	var  High_radius   = 0.3;   // highlighted-Edge cylinder

	// Materials
	var  Vert_matrl  = new THREE.MeshLambertMaterial( {color: 0xffcc00} );  // for Vertex spheres (gold)
	var  Frame_matrl = new THREE.MeshLambertMaterial( {color: 0x8d8d8d} );  // for normal Edges (silver)
	var  High_matrl  = new THREE.MeshLambertMaterial( {color: 0x00ff00} );  // for highlighted Edges (green)

	var  Type1_matrl = new THREE.MeshLambertMaterial({    // for basic Faces
		vertexColors: THREE.FaceColors,
		side:         THREE.DoubleSide,
		transparent:  true,
		opacity:      Opts1.Opacity,
		});
	var  Type2_matrl = Type1_matrl.clone();    Type2_matrl.opacity = Opts2.Opacity;

	// Geometries
	var  Vert_geom   = new THREE.SphereGeometry( Sphere_radius, 12, 6 );   // prototype
	var  Vert_subset = new THREE.Geometry();   // collection of highlighted Vertices
	var  Edge_frame  = new THREE.Geometry();   // complete Edge framework
	var  Edge_subset = new THREE.Geometry();   // highlighted Edges
	var  Type1_geom  = new THREE.Geometry();   // Faces of Type 1
	var  Type2_geom  = new THREE.Geometry();   // Faces of Type 2 (if not part of a Compound)

	// Meshes
	var  Type1_mesh = new THREE.Mesh( Type1_geom, Type1_matrl );
	var  Type2_mesh = new THREE.Mesh( Type2_geom, Type2_matrl );

	
	//===  Load all point coordinates
	var  Points = [];
	for(  var P = 0;  P < Defn.Coords.length;  P++  ){
		Points.push( new THREE.Vector3( Defn.Coords[P][0]
		                              , Defn.Coords[P][1]
		                              , Defn.Coords[P][2] ).multiplyScalar(Scaling) );
		}
	Type1_geom.vertices = Points;
	Type2_geom.vertices = Points;

	//===  Construct Edge framework
	for(  var E = 0;  E < Defn.Edge_Indices.length;  E++  ){
		var  Edge = Defn.Edge_Indices[E];
		var  Cyl  = Cylinder_mesh( Points[Edge[0]], Points[Edge[1]], Frame_radius );
		THREE.GeometryUtils.merge( Edge_frame, Cyl );
		}
	Structure.add( new THREE.Mesh( Edge_frame, Frame_matrl ) );

	if(  Model_option == "Edge"  ){ 	// Single-Edge model
			var  E_parms = Defn.Single_Edge;
			var  It      = Defn.Edge_Indices[E_parms.E];
			//===  Highlight incident Vertices
			Highlight_Vertex( Points[It[0]] );
			Highlight_Vertex( Points[It[1]] );
			//===  Highlight this Edge
			Highlight_Edge( It );
			//===  Construct incident Faces
			Gen_one_Face( Type1_geom, Defn.Type1_Faces[E_parms.F1], Opts1.Faces_single, Opts1.RGB_std );
			if(  E_parms.F2_typ == 1  ){    // Second Face is of Type 1
					Gen_one_Face( Type1_geom, Defn.Type1_Faces[E_parms.F2], Opts1.Faces_single, Opts1.RGB_2nd );
					}
				else{                   // Second Face is of Type 2
					Gen_one_Face( Type2_geom, Defn.Type2_Faces[E_parms.F2], Opts2.Faces_single, Opts2.RGB_std );
					}
			}

		else if(  Model_option.startsWith( "Vert" )  ){ 	// Single-Vertex model
			var  V_parms = (Model_option.endsWith( "A" )  ? Defn.Single_A_Vert  : Defn.Single_B_Vert);
			//===  Highlight this Vertex (and maybe adjacent Vertices?)
			Highlight_Vertex( Points[V_parms.V] );
			//for(  var V = 0;  V < V_parms.Verts.length;  V++  ){
			//	Highlight_Vertex( Points[V_parms.Verts[V]] );
			//	}
			//===  Highlight incident Edges
			for(  var E = 0;  E < V_parms.Edges.length;  E++  ){
				Highlight_Edge( Defn.Edge_Indices[V_parms.Edges[E]] );
				}
			//===  Construct incident Faces
			for(  var F = 0;  F < V_parms.Type1s.length;  F++  ){
				Gen_one_Face( Type1_geom, Defn.Type1_Faces[V_parms.Type1s[F]], Opts1.Faces_single, Opts1.RGB_std );
				}
			for(  var F = 0;  F < V_parms.Type2s.length;  F++  ){
				Gen_one_Face( Type2_geom, Defn.Type2_Faces[V_parms.Type2s[F]], Opts2.Faces_single, Opts2.RGB_std );
				}
			}

		else if(  Defn.Tag == "I53b_2x"  ){ 	// Exploded-Vertex model
			//===  Highlight just this Vertex
			Highlight_Vertex( Points[Defn.Single_B_Vert.V] );
			//===  Construct Faces
			Gen_one_Face(    Type1_geom, Defn.Type1_Faces[0], Opts1.Faces_single, Opts1.RGB_hi  );
			Gen_one_Face(    Type1_geom, Defn.Type1_Faces[1], Opts1.Faces_single, Opts1.RGB_hi2 );
			Gen_as_Complete( Type1_geom, Defn.Type1_Faces[2], Opts1.RGB_std );    // These are actually two strips
			Gen_as_Complete( Type1_geom, Defn.Type1_Faces[3], Opts1.RGB_std );    //     of the third face
			}

		else{ 			// Full model - includes Compounds and directed-Edge objects
			//===  Highlight all Vertices
			for(  var V = 1;  V <= Defn.Stats.VA + Defn.Stats.VB;  V++  ){
				Highlight_Vertex( Points[V] );
				}
			//===  Construct Faces
			var  Coloring_rule = (Defn.hasOwnProperty("Coloring")  ? Defn.Coloring  : "Normal");
			if(  Coloring_rule == "Compound"  ){
					Type1_matrl.opacity = Opts_Comp.Opacity;
					Gen_Compound_Faces( Type1_geom, Defn.Type1_Faces, Opts_Comp.Show_as );
					Gen_Compound_Faces( Type1_geom, Defn.Type2_Faces, Opts_Comp.Show_as );
					}
				else{
					Gen_Faces( Type1_geom, Defn.Type1_Faces, Opts1 );
					Gen_Faces( Type2_geom, Defn.Type2_Faces, Opts2 );
					}
			}

	Type1_geom.computeFaceNormals();
	Type2_geom.computeFaceNormals();

	Structure.add( new THREE.Mesh( Vert_subset, Vert_matrl ) );
	Structure.add( new THREE.Mesh( Edge_subset, High_matrl ) );
	Structure.add( Type1_mesh  );
	Structure.add( Type2_mesh  );
//	Structure.add( new THREE.AxisHelper( 1.2 * Scaling ) );

	return Structure;
	//////////////////////////////////////////////////////


	function  Highlight_Vertex( Here ){
		var  V_mesh = new THREE.Mesh( Vert_geom );
		V_mesh.position = Here;
		THREE.GeometryUtils.merge( Vert_subset, V_mesh );
		}

	function  Highlight_Edge( Edge ){
		var  E_mesh = Cylinder_mesh( Points[Edge[0]], Points[Edge[1]], High_radius );
		THREE.GeometryUtils.merge( Edge_subset, E_mesh );
		}


	function  Gen_Faces( Geom, Face_defns, Opts ){
		var  Color;
		if(  Opts.Show_as != "Hidden"  ){
			for( var F = 0;  F < Face_defns.length;  F++  ){
				if(  Opts.High  &&  Face_defns[F].Hi == 1  ){    Color = Opts.RGB_hi ;   }
					else                                {    Color = Opts.RGB_std;   }
				Gen_one_Face( Geom, Face_defns[F], Opts.Show_as, Color );
				}
			}
		}

	function  Gen_one_Face( Geom, Face, Show_as, Color ){
		if(  Show_as == "All Complete"  ||
		     ( Show_as == "One Complete"  &&  Face.Hi == 1 )  ||
		       Face.Str.length < Face.Edj.length                 ){    // insufficient Strip indices
				Gen_as_Complete( Geom, Face, Color );
				}
			else{
				Gen_as_Strips(   Geom, Face, Color );
				}
		} 

	function  Gen_as_Complete( Geom, Face, Color ){
		var  Center = Face.Ctr;
		var  E_nums = Face.Edj;
		for(  var E = 0;  E < E_nums.length-1;  E ++  ){
			Add_Facelet( Geom, Face, Center, E_nums[E], E_nums[E+1], Color );
			}
		}

	function  Gen_as_Strips( Geom, Face, Color ){
		var  E_nums = Face.Edj;
		var  S_nums = Face.Str;
		for(  var E = 0;  E < E_nums.length-1;  E ++  ){
			Add_Facelet( Geom, Face, E_nums[E  ], E_nums[E+1], S_nums[E+1], Color );
			Add_Facelet( Geom, Face, S_nums[E+1], S_nums[E  ], E_nums[E  ], Color );
			}
		}

	// Face completeness and color are applied per Component
	function  Gen_Compound_Faces( Geom, Face_defns, Show_as ){
		for(  var F = 0;  F < Face_defns.length;  F++  ){
			var  Face = Face_defns[F];
			if(  Show_as == "All Complete"  ||
			     ( Show_as == "One Complete"  &&  Face.Comp == 1 )  ){
					Gen_as_Complete( Geom, Face, Compound_colors[Face.Comp] );
					}
				else{
					Gen_as_Strips(   Geom, Face, Compound_colors[Face.Comp] );
					}
			}
		}


	function  Add_Facelet( Geom,  Face,  V1, V2, V3,  Color ){
		var  NF = new THREE.Face3( V1, V2, V3 );
		NF.color = Color;
		Geom.faces.push( NF );
		}

	}

	

// Create a cylinder from the centers of the two bases and a radius
//   (This really ought to be built in ... and purely geometric.)
function  Cylinder_mesh( Point1, Point2, Radius ){
	var  L    = new THREE.Vector3().subVectors( Point2, Point1 ).length();
	var  Cyl  = new THREE.CylinderGeometry( Radius, Radius, L, 8, 4 );
	var  Axis = new THREE.Vector3(
		(Point1.x - Point2.x    ),
		(Point1.y - Point2.y + L),
		(Point1.z - Point2.z    )  ).normalize();
	var  m;   // dummy material
	var  C_mesh = new THREE.Mesh( Cyl, m );   //  A mesh is required for the following operations.
	C_mesh.setRotationFromAxisAngle( Axis, Math.PI );
	C_mesh.position = new THREE.Vector3().addVectors( Point1, Point2 ).multiplyScalar(0.5);
	return  C_mesh;
	}


// ************* Rendering *************
function  animate(){
	requestAnimationFrame( animate );
	render();		
	update();
	}

function  render(){    Renderer.render( Scene, Camera );    }

function  update(){
	if(  Camera.position.length() >  600  ){    Camera.position.setLength( 600);    }
	if(  Camera.position.length() < .001  ){    Camera.position.setLength(.001);    }
	Controls.update();
	}


// *************  Identification Banner  *************
function  Make_Banner( Ident ){
	var  Font_face = "Arial";
	var  Font_size = 18;

	// create canvas, resize later.
	var  Canvas  = document.createElement('canvas');
	var  Context = Canvas.getContext('2d');
	Context.font = "Bold "+ Font_size +"px "+ Font_face;

	// get size data (height depends only on font size)
	var  Text_width = Context.measureText( Ident ).width;
	// calculate correct dimensions of canvas and resize
	var  Margin      =  2;
	var  Image_width  = Text_width  +  Margin * 2;
	var  Image_height = Font_size * 1.44  +  Margin * 2;    // 1.44 is extra height factor for text below baseline: g,j,p,q.
	Canvas.width  = Image_width;
	Canvas.height = Image_height;
	// changed canvas, new context
	Context = Canvas.getContext('2d');
	Context.font = "Bold "+ Font_size +"px "+ Font_face;

	// content
	Context.fillStyle = "rgba( 0, 0, 0, 1.0 )";
	Context.fillText( Ident,  Margin,  Font_size + Margin );

	// canvas contents will be used for a texture
	var  Texture = new THREE.Texture( Canvas );
	Texture.needsUpdate = true;

	var  Sprite_matrl = new THREE.SpriteMaterial({
		map: Texture,
		useScreenCoordinates: true,
		alignment: THREE.SpriteAlignment.topCenter
		});
	var  Sprite = new THREE.Sprite( Sprite_matrl );
	Sprite.width  = Image_width;
	Sprite.height = Image_height;
	Sprite.scale.set( Sprite.width, Sprite.height, 1.0 );
	return  Sprite;
	}

