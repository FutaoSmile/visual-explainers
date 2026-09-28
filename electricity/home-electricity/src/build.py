"""Build the two self-contained electricity exhibits. Python standard library only."""
from pathlib import Path
from html import escape
import json
import math

HERE = Path(__file__).resolve().parent
OUT = HERE.parent

def p(x, y, z=0):
    return (520 + (x-y)*.88, 212 + (x+y)*.42-z*.90)

def points(coords):
    return ' '.join(f'{a:.1f},{b:.1f}' for a,b in coords)

def poly(coords, fill, stroke='#83a2b026', extra=''):
    return f'<polygon points="{points(coords)}" fill="{fill}" stroke="{stroke}" stroke-width="1" {extra}/>'

def floor(x,y,w,d,fill,extra=''):
    return poly([p(x,y),p(x+w,y),p(x+w,y+d),p(x,y+d)],fill,extra=extra)

def box(x,y,w,d,h,top='#526574',left='#263946',right='#344a58',z=0,extra=''):
    a,b,c,e=[p(*v) for v in [(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)]]
    ab,bb,cb,eb=[p(*v) for v in [(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z)]]
    return '<g '+extra+'>'+poly([e,c,cb,eb],left)+poly([b,c,cb,bb],right)+poly([a,b,c,e],top)+'</g>'

def line(coords, color, width=2, extra=''):
    return f'<polyline points="{points(coords)}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'

def worldline(coords,color,width=2,extra=''):
    return line([p(*v) for v in coords],color,width,extra)

def ellipse(x,y,z,rx,ry,fill,extra=''):
    a,b=p(x,y,z)
    return f'<ellipse cx="{a:.1f}" cy="{b:.1f}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'

def text(x,y,s,size=17,fill='#a5bac9',extra=''):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" {extra}>{escape(s)}</text>'

def art_house():
    out=['''<svg id="house-svg" class="house-art" viewBox="0 0 1200 850" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="house-title house-desc">
<title id="house-title">家庭电力交互剖面</title><desc id="house-desc">厨房、卧室、客厅和浴室组成的立体住宅。电表连接配电箱，再向五条示例回路供电。用旁边的电器按钮控制灯光和能量流。</desc>
<defs>
 <linearGradient id="wall-a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#233d4d"/><stop offset="1" stop-color="#142532"/></linearGradient>
 <linearGradient id="wall-b" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2f4857"/><stop offset="1" stop-color="#1b2c39"/></linearGradient>
 <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#146a79"/><stop offset=".6" stop-color="#0d243f"/><stop offset="1" stop-color="#a76456"/></linearGradient>
 <radialGradient id="ground-glow"><stop stop-color="#43e6c1" stop-opacity=".14"/><stop offset="1" stop-color="#43e6c1" stop-opacity="0"/></radialGradient>
 <radialGradient id="warm-glow"><stop stop-color="#ffc772" stop-opacity=".48"/><stop offset="1" stop-color="#ffca74" stop-opacity="0"/></radialGradient>
 <radialGradient id="cool-glow"><stop stop-color="#6ce8df" stop-opacity=".4"/><stop offset="1" stop-color="#62dbef" stop-opacity="0"/></radialGradient>
 <radialGradient id="danger-glow"><stop stop-color="#ff775c" stop-opacity=".6"/><stop offset="1" stop-color="#ff775c" stop-opacity="0"/></radialGradient>
 <linearGradient id="tube" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#60727c"/><stop offset=".45" stop-color="#dce2df"/><stop offset="1" stop-color="#899ba1"/></linearGradient>
 <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
 <filter id="tiny-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.7"/></filter>
</defs>
<g class="stage-grid" stroke="#32546a" stroke-opacity=".18" stroke-width="1">''']
    for i in range(-120,801,80):
        out.append(worldline([(i,-60,-36),(i,620,-36)],'#42627a33',1))
    for i in range(-80,641,80):
        out.append(worldline([(-100,i,-36),(800,i,-36)],'#42627a33',1))
    out += ['</g>','<ellipse cx="593" cy="564" rx="535" ry="235" fill="url(#ground-glow)"/>','<ellipse cx="582" cy="605" rx="415" ry="139" fill="#01060d" opacity=".55"/>']
    # Floating foundation; room surfaces deliberately keep architectural materials.
    out.append(box(-10,-10,640,500,30,'#324351','#121e2b','#1b2c3c',z=-32))
    out.append(worldline([(-10,490,-29),(630,490,-29),(630,-10,-29)],'#406178',2))
    out.append(floor(0,0,302,229,'#30434a'))
    out.append(floor(314,0,306,229,'#39434d'))
    out.append(floor(0,241,302,239,'#314653'))
    out.append(floor(314,241,306,239,'#263e49'))
    # Tile joints and wood planks.
    for x in range(0,303,50): out.append(worldline([(x,0,1),(x,229,1)],'#82909125',1))
    for y in range(0,230,46): out.append(worldline([(0,y,1),(302,y,1)],'#82909125',1))
    for y in range(6,229,18): out.append(worldline([(314,y,1),(620,y,1)],'#78808928',1))
    for x in range(314,621,51): out.append(worldline([(x,241,1),(x,480,1)],'#719bac25',1))
    for y in range(241,481,48): out.append(worldline([(314,y,1),(620,y,1)],'#719bac25',1))
    # Exterior back walls, capped in metal. No front walls: genuine cutaway.
    out.append(poly([p(0,0),p(620,0),p(620,0,172),p(0,0,172)],'url(#wall-b)'))
    out.append(poly([p(0,0),p(0,480),p(0,480,172),p(0,0,172)],'url(#wall-a)'))
    out.append(box(-7,-7,634,7,5,'#597080','#213745','#324f5e',z=172))
    out.append(box(-7,0,7,487,5,'#597080','#263b4a','#314b5b',z=172))
    # Wall panelling.
    for x in [160,310,465]: out.append(worldline([(x,0,10),(x,0,169)],'#7991a222',1))
    for y in [120,240,360]: out.append(worldline([(0,y,10),(0,y,169)],'#7991a222',1))
    # Kitchen window (horizontal, looking out onto a graphic city skyline).
    out.append(poly([p(36,0,92),p(220,0,92),p(220,0,150),p(36,0,150)],'#112b3a','#5b7485'))
    for x,h in [(43,15),(71,27),(96,20),(128,35),(161,25),(189,41)]:
        out.append(poly([p(x,0,94),p(x+17,0,94),p(x+17,0,94+h),p(x,0,94+h)],'#245064','#245064'))
    out.append(worldline([(126,0,92),(126,0,150)],'#617e8d',2))
    # Kitchen cabinetry and counter.
    out.append(box(15,8,267,66,75,'#b2b7b2','#425564','#344a59'))
    out.append(box(12,5,273,72,5,'#aebdbb','#778988','#9baba9',z=75))
    for x in [20,84,149,213]:
        out.append(worldline([(x,74,9),(x,74,69),(x+56,74,69),(x+56,74,9)],'#7e94a066',1))
        out.append(worldline([(x+17,76,62),(x+37,76,62)],'#c9d0ce',2))
    # Sink and tap.
    out.append(poly([p(28,22,81),p(77,22,81),p(77,61,81),p(28,61,81)],'#35464c','#c0ccc9'))
    out.append(poly([p(34,29,81),p(71,29,81),p(71,55,81),p(34,55,81)],'#1b2d36'))
    out.append(worldline([(48,15,81),(48,15,107),(54,24,109),(54,32,100)],'#aebebc',3))
    # Hob with two visible induction rings.
    out.append(box(145,13,85,53,2,'#101c25','#172732','#172732',z=81))
    for x,y in [(171,30),(205,49)]:
        a,b=p(x,y,84)
        out.append(f'<ellipse cx="{a}" cy="{b}" rx="13" ry="6.4" fill="#1d2b34" stroke="#526573"/>')
        out.append(f'<ellipse class="device-lit" data-lit="hob" cx="{a}" cy="{b}" rx="13" ry="6.4" fill="none" stroke="#ffc072" stroke-width="2"/>')
    out.append(box(155,23,29,24,14,'#566671','#243745','#334859',z=84))
    out.append(worldline([(184,35,94),(209,35,94)],'#7a8990',4))
    # Kettle, brushed metal and dark handle.
    a,b=p(112,40,80)
    out.append(f'<g transform="translate({a},{b})"><ellipse cx="0" cy="0" rx="14" ry="7" fill="#0e1f2b"/><path d="M-11-3L-8-31Q0-40 9-31L13-5Q0 4-11-3" fill="url(#tube)" stroke="#96a8ac"/><path d="M9-28Q28-29 19-9L12-9" fill="none" stroke="#243946" stroke-width="5"/><path d="M-9-26L-19-29L-11-14" fill="#8fa5ab"/><ellipse cy="-32" rx="9" ry="3.5" fill="#596d78"/><circle class="device-lit" data-lit="kettle" cx="4" cy="-8" r="2.5" fill="#ffba64"/><path class="steam device-lit" data-lit="kettle" d="M-5-43q-9-10 0-19m10 14q-9-10 0-19" fill="none" stroke="#bad5d3" stroke-opacity=".65" stroke-width="2"/></g>')
    # Fridge (right side of the kitchen).
    out.append(box(234,94,57,58,153,'#a1aeb4','#78909e','#687f8d'))
    out.append(worldline([(234,153,48),(291,153,48)],'#3b5565',2))
    out.append(worldline([(281,155,78),(281,155,125)],'#cbd5d6',3))
    a,b=p(266,156,132)
    out.append(f'<rect x="{a-8}" y="{b-5}" width="17" height="9" rx="1.5" fill="#172e3b"/><circle class="device-lit" data-lit="fridge" cx="{a}" cy="{b}" r="1.8" fill="#4cf3bc"/>')
    # Low cut partitions.
    out.append(box(301,0,13,240,45,'#536575','#1e3444','#2a4253'))
    out.append(box(0,229,112,12,42,'#5b6d7a','#293e4c','#2d4657'))
    out.append(box(237,229,65,12,42,'#5b6d7a','#293e4c','#2d4657'))
    # Bedroom: textured rug, low timber bed, pillows and fold.
    out.append(floor(329,50,233,168,'#67737c'))
    for y in range(53,217,7): out.append(worldline([(331,y,1),(560,y,1)],'#a4aeb425',.8))
    out.append(box(365,64,146,145,25,'#293c4a','#253440','#3e4b55'))
    out.append(box(360,52,157,12,83,'#867976','#625854','#726965'))
    out.append(box(362,64,154,142,14,'#bdc3bd','#8d9b9d','#a2aeaa',z=25))
    out.append(box(365,101,148,103,7,'#6f9899','#4c7a83','#5c8990',z=39))
    out.append(box(365,180,148,24,5,'#b7b3a5','#8a918c','#a3a79a',z=46))
    out.append(box(373,69,57,29,10,'#dad5c7','#a5aca6','#b4bcb4',z=39))
    out.append(box(448,69,57,29,10,'#dad5c7','#a5aca6','#b4bcb4',z=39))
    for y in [124,140,158]: out.append(worldline([(370,y,47),(509,y,47)],'#a1bbbb55',1))
    out.append(box(537,70,43,40,42,'#8d8476','#544f4b','#70675c'))
    out.append(ellipse(557,90,45,12,5,'#0f2433'))
    out.append(worldline([(557,90,45),(557,90,73)],'#c4b58e',3))
    a,b=p(557,90,80)
    out.append(f'<path d="M{a-13} {b}l5-18h16l6 18z" fill="#d1c2a1"/><ellipse class="device-lit" data-lit="lighting" cx="{a}" cy="{b+25}" rx="64" ry="24" fill="url(#warm-glow)"/>')
    # AC unit on bedroom back wall, with louvres and airflow.
    out.append(box(454,4,125,22,32,'#b8c4c3','#8ca3a7','#75929e',z=113))
    for z in [119,123]: out.append(worldline([(464,27,z),(570,27,z)],'#3c5865',2))
    for x in [480,515,550]:
        out.append(worldline([(x,29,116),(x,59,88),(x,89,72)],'#63d9e4',2,'class="airflow device-lit" data-lit="ac"'))
    # Living room rug and television on the left wall.
    out.append(floor(54,294,211,168,'#52747d'))
    out.append(floor(60,300,199,156,'#42606c'))
    for x in range(60,259,9): out.append(worldline([(x,300,1),(x,455,1)],'#9cb3b41c',1))
    out.append(box(9,363,35,94,35,'#7d8b8d','#344f5e','#476572'))
    out.append(poly([p(3,357,73),p(3,462,73),p(3,462,140),p(3,357,140)],'#07101c','#788f9d'))
    out.append(poly([p(3,361,78),p(3,458,78),p(3,458,136),p(3,361,136)],'url(#screen)',extra='class="device-lit" data-lit="tv"'))
    out.append(poly([p(3,362,81),p(3,411,108),p(3,439,79)],'#5487a1',extra='class="device-lit" data-lit="tv" opacity=".65"'))
    out.append(worldline([(3,412,74),(17,413,39)],'#566f7c',4))
    # Sofa, cushions, seams, legs.
    for x in [65,203]:
        for y in [287,351]: out.append(box(x,y,7,7,12,'#252d35','#131d27','#16232d'))
    out.append(box(55,281,170,78,31,'#9caba9','#657c81','#7d9599',z=12))
    out.append(box(55,280,170,16,51,'#b4bcad','#748a88','#8c9e96',z=12))
    out.append(box(50,279,16,83,45,'#b2bbaf','#647d7f','#8a9f9c',z=12))
    out.append(box(216,279,16,83,45,'#b2bbaf','#647d7f','#8a9f9c',z=12))
    out.append(box(68,299,68,56,10,'#aabbaf','#77968e','#8ba79c',z=43))
    out.append(box(141,299,68,56,10,'#aabbaf','#77968e','#8ba79c',z=43))
    out.append(box(72,300,26,23,17,'#cfb98f','#9c8c72','#b09c7d',z=53))
    out.append(box(179,299,26,23,17,'#759397','#4f717f','#628894',z=53))
    # Coffee table: floating top, books, small cup.
    for x in [105,175]:
        for y in [389,420]: out.append(box(x,y,4,4,30,'#455963','#263b4a','#2d4555'))
    out.append(box(97,383,95,46,5,'#a5957e','#756f65','#837867',z=30))
    out.append(box(116,393,28,19,3,'#aacac4','#709a97','#86b4ac',z=35))
    out.append(box(118,393,23,17,3,'#d0b693','#9e8c79','#af9d84',z=38))
    out.append(ellipse(167,405,37,6,3,'#d8d7c8'))
    # Laptop on slim console in front of the cutaway.
    out.append(box(233,378,54,85,54,'#847966','#434b4b','#5e645b'))
    out.append(box(240,402,33,28,2,'#8ea4ae','#4a6577','#6d8290',z=55))
    out.append(poly([p(240,402,56),p(273,402,56),p(273,402,82),p(240,402,82)],'#17374b','#9bafb7'))
    out.append(poly([p(243,402,60),p(270,402,60),p(270,402,79),p(243,402,79)],'#53adbe',extra='class="device-lit" data-lit="pc"'))
    # Bathroom partition and basin, mirror, heated-water tank.
    out.append(box(314,234,306,9,70,'#657c89','#2c4759','#365567'))
    out.append(box(557,250,58,68,72,'#c1cbc7','#7c9299','#a6b7b6'))
    out.append(box(553,246,66,76,6,'#d5d9cb','#9faeaa','#bdc6bb',z=72))
    out.append(poly([p(565,261,79),p(602,261,79),p(602,301,79),p(565,301,79)],'#425b69','#a9c4c6'))
    out.append(worldline([(580,250,79),(580,250,103),(584,260,103)],'#c4d1ce',3))
    # Wall-supported water heater above partition (tank, pipes, lit indicator).
    a,b=p(365,239,124)
    out.append(f'<g id="heater-object" transform="translate({a},{b})"><path d="M-36-17Q-40-25-31-28L29-19Q39-16 38-6L38 25Q38 34 29 32L-30 22Q-36 20-36 12Z" fill="url(#tube)" stroke="#9dafb5"/><path d="M-30 22V39L-14 47m31-16v22l23 12" fill="none" stroke="#6b92a3" stroke-width="3"/><rect x="-8" y="-4" width="23" height="14" rx="2" fill="#233b48"/><text class="device-lit" data-lit="heater" x="-4" y="6" font-size="9" fill="#6cf1cb">55°</text></g>')
    # Freestanding bathtub, thick lip, visible inset water.
    out.append(box(363,352,189,85,45,'#c5d1ce','#8caaa9','#a6bebb'))
    out.append(box(363,352,189,85,7,'#dce1d5','#aac4c0','#c3d3c9',z=45))
    out.append(poly([p(376,364,53),p(539,364,53),p(539,425,53),p(376,425,53)],'#447481','#c4d8d0'))
    out.append(poly([p(385,371,53),p(532,371,53),p(532,418,53),p(385,418,53)],'#68a2aa','#86b9ba'))
    for y in [381,397,409]: out.append(worldline([(397,y,54),(519,y,54)],'#bee0d144',1.5))
    out.append(worldline([(553,352,0),(553,352,91),(542,363,91),(542,371,82)],'#b4c7c6',4))
    # Towel stack and small bath mat.
    out.append(box(379,354,45,14,5,'#e0ccaa','#bda98d','#c7b18f',z=53))
    out.append(box(382,354,40,14,4,'#899d8f','#637f7a','#779388',z=58))
    out.append(floor(460,444,105,29,'#638182'))
    # Indoor tree in front-left, with deliberate organic shapes.
    out.append(box(35,452,25,23,31,'#867f6e','#586b6d','#657a7b'))
    out.append(worldline([(47,464,30),(47,464,89)],'#91a696',3))
    for dx,dy,z,rx,ry in [(-5,1,71,15,7),(6,-3,82,16,8),(-6,-4,96,16,9),(0,6,62,14,7)]:
        a,b=p(47+dx,464+dy,z)
        out.append(f'<ellipse cx="{a}" cy="{b}" rx="{rx}" ry="{ry}" fill="#537e76" stroke="#789d83" transform="rotate({-35 if dx<0 else 35} {a} {b})"/>')
    # Lighting washes live with the lighting circuit.
    out.append('<g class="device-lit lighting-wash" data-lit="lighting" style="mix-blend-mode:screen">')
    for x,y,rx in [(130,160,125),(140,380,156),(460,150,145),(460,350,135)]:
        out.append(ellipse(x,y,3,rx,rx*.40,'url(#warm-glow)'))
    out.append('</g>')
    # Five distinct routes; these show logical supply, not physical wall routing.
    routes={
        'kitchen':[(8,252,6),(25,231,6),(25,173,6),(110,173,6)],
        'sockets':[(8,252,6),(22,276,6),(22,389,6)],
        'lighting':[(8,252,6),(127,252,6),(127,315,6),(192,315,6)],
        'ac':[(8,252,6),(305,252,6),(305,17,6),(514,17,6),(514,17,123)],
        'water':[(8,252,6),(310,252,6),(348,270,6),(367,270,6),(367,239,94)]}
    colors={'lighting':'#ffe0a3','sockets':'#57dcee','kitchen':'#ffb86e','ac':'#91acf9','water':'#67e3bd'}
    out.append('<g id="wiring" class="wiring">')
    for name,coords in routes.items():
        pts=points([p(*c) for c in coords])
        out.append(f'<g class="circuit-route" data-circuit="{name}" style="--route:{colors[name]}"><polyline points="{pts}" class="route-halo"/><polyline points="{pts}" class="route-track"/><polyline points="{pts}" class="route-flow"/></g>')
    # Branches reuse the same circuit (not a separate protection for each device).
    branches=[('kitchen','fridge',[(110,173,6),(247,173,6),(262,155,65)]),('kitchen','hob',[(110,173,6),(110,93,6),(173,93,6),(173,35,87)]),('kitchen','kettle',[(110,173,6),(110,93,6),(110,43,86)]),('sockets','tv',[(22,389,6),(24,431,42)]),('sockets','pc',[(22,389,6),(272,445,6),(270,424,58)]),('lighting','lighting',[(127,252,6),(127,156,6)]),('lighting','lighting',[(127,252,6),(430,252,6),(430,202,6)]),('lighting','lighting',[(430,252,6),(463,335,6)])]
    for name,device,coords in branches:
        pts=points([p(*c) for c in coords])
        out.append(f'<g class="circuit-route" data-circuit="{name}" data-device-route="{device}" style="--route:{colors[name]}"><polyline points="{pts}" class="route-track minor"/><polyline points="{pts}" class="route-flow minor"/></g>')
    out.append('</g>')
    # Supply meter (outside home) and panel mounted on left wall.
    a,b=p(0,252,102)
    out.append(f'<g id="distribution-object" transform="translate({a-25},{b-51})"><path d="M0 0L65 23V98L0 75Z" fill="#728a98" stroke="#c1d0d0"/><path d="M7 10L58 28V86L7 69Z" fill="#152c3d" stroke="#4d687b"/><path d="M12 19L50 32" stroke="#62e8d5" stroke-width="3"/>')
    for i in range(5):
        out.append(f'<path class="mini-breaker" data-mini-breaker="{list(routes)[i]}" d="M{12+i*8} {42+i*2.8}l5 1.8v15l-5-1.8z" fill="#d4dcd1"/>')
    out.append('</g>')
    out.append(f'<path id="incoming-path" class="incoming-flow" d="M135 250H177L{a-20:.1f} {b:.1f}" fill="none"/>')
    target=p(8,252,6)
    out.append(line([(a+7,b+25),(a+7,target[1]),target],'#79d8c5',3,'opacity=".7"'))
    out.append('<g id="meter-object" transform="translate(59 202)"><rect width="77" height="96" rx="8" fill="#b6c3c5" stroke="#eceddf"/><rect x="8" y="9" width="61" height="40" rx="4" fill="#1f3543"/><text x="14" y="29" font-size="13" fill="#adeddc" font-family="Consolas,monospace">00384.6</text><text x="48" y="42" font-size="8" fill="#9bafba">kWh</text><circle cx="19" cy="63" r="3" fill="#76ffd2" class="meter-led"/><path d="M31 62h29m-45 16h46" stroke="#6d8790" stroke-width="2"/><rect x="24" y="87" width="30" height="12" rx="2" fill="#66818b"/></g>')
    out.append(text(57,184,'入户电表',18,'#c1d3dc'))
    out.append(text(57,327,'记录消耗的电量',14,'#8ba5b7'))
    out.append(text(227,283,'配电箱',17,'#cfdfeb'))
    out.append(line([(247,291),(270,319),(a,b+39)],'#a6c4cf80',1))
    # Fault beacon and PE trace, hidden until an experiment activates it.
    a,b=p(110,80,95)
    out.append(f'<g class="fault-beacon" id="fault-kitchen" transform="translate({a},{b})"><circle r="53" fill="url(#danger-glow)"/><circle r="21" fill="#381f1c" stroke="#ffb28e"/><text y="7" text-anchor="middle" font-size="23" fill="#ffe0c5">!</text></g>')
    a,b=p(365,239,124)
    out.append(f'<g class="fault-beacon" id="fault-water" transform="translate({a},{b})"><circle r="60" fill="url(#danger-glow)"/><circle r="22" fill="#381f1c" stroke="#ffb28e"/><text y="8" text-anchor="middle" font-size="24" fill="#ffe0c5">!</text></g>')
    out.append(worldline([(365,239,95),(365,239,4),(332,259,4),(10,259,4)],'#a2ea8d',3,'id="leak-route" class="leak-route" stroke-dasharray="6 6"'))
    # Elegant exterior room labels, all with data-driven operating state.
    labels=[('kitchen',333,114,'厨房',p(85,85,85)),('ac',949,247,'卧室',p(540,110,40)),('sockets',104,641,'客厅',p(163,430,25)),('water',897,675,'浴室',p(531,403,30))]
    for key,x,y,title,anchor in labels:
        end=(x+58,y+15) if key in ['kitchen','sockets'] else (x-16,y+15)
        out.append(line([anchor,(end[0],anchor[1]+15),end],'#6d91a970',1))
        out.append(f'<g class="room-label" data-room-label="{key}" transform="translate({x} {y})"><circle cx="0" cy="-6" r="3" fill="{colors[key]}"/>')
        out.append(text(12,0,title,19,'#dbe8ee','font-weight="600"'))
        out.append(text(12,25,'— W',15,colors[key],f'data-room-watts="{key}" font-family="Consolas,monospace"'))
        out.append('</g>')
    out.append('''<g id="scene-caption"><path d="M441 760h319" stroke="#415969"/>
<text x="600" y="790" text-anchor="middle" fill="#8ea9b9" font-size="16" letter-spacing="3">一座家 · 五条示例回路</text></g></svg>''')
    return '\n'.join(out)


def build():
    house=art_house()
    (HERE/'house.svg').write_text(house,encoding='utf-8')
    shell=(HERE/'shell.html').read_text(encoding='utf-8')
    css=(HERE/'styles.css').read_text(encoding='utf-8')
    js=(HERE/'app.js').read_text(encoding='utf-8')
    model=(HERE/'model.js').read_text(encoding='utf-8')
    labs=(HERE/'labs.html').read_text(encoding='utf-8')
    for name,mode in [('一眼看懂家庭用电.html','guide'),('家庭用电全景拓扑图.html','stage')]:
        page=shell.replace('{{CSS}}',css).replace('{{HOUSE}}',house).replace('{{LABS}}',labs).replace('{{MODEL}}',model).replace('{{JS}}',js).replace('{{MODE}}',mode)
        page=page.replace('{{TITLE}}','家庭电力实验室｜让看不见的电，变得看得见' if mode=='guide' else '家庭电力全景展台｜交互剖面与保护实验')
        (OUT/name).write_text(page,encoding='utf-8')
        print(f'Built {name}: {len(page.encode("utf-8")):,} bytes')

if __name__=='__main__':
    import sys
    if '--art-only' in sys.argv:
        (HERE/'house.svg').write_text(art_house(),encoding='utf-8')
    else:
        build()
