#UseHook
#If (!WinActive(games) OR WinActive(" - Google Chrome")) AND !WinActive(chromeGames)
    [:: Send {-}
    ]:: Send {BS}
    `;:: Send {}
    ':: Send {`;}
    +1:: Send {!}
    +2:: Send {@}
    +3:: Send {#}
    +4:: Send {$}
    +5:: Send {`%}
    +6:: Send {^}
    +7:: Send {&}
    +8:: Send {*}
    +9:: Send {(}
    +0:: Send {)}
    +q:: Send {BS}
    +w:: Send {Home}
    <+e:: Send {Up}
    <+r:: Send {End}
    +t:: Send {{}
    +y:: Send {}}
    +u:: Send {[}
    +i:: Send {]}
    +o:: Send {"} ; this is workarround comment for formatter bug"}
    +p:: Send {'}
    +[:: Send {_}
    +]:: Send {BS}
    +a:: Send {BS}
    <+s:: Send {Left}
    <+d:: Send {Down}
    <+f:: Send {Right}
    <+>+f:: Send +{Right}
    +g:: Send ^{Left}+^{Right}
    +h:: Send {+}
    +j:: Send {(}
    +k:: Send {)}
    +l:: Send {=}
    +':: Send {:}
    +z:: Send {@}
    +x:: Send {#}
    +c:: Send {$}
    +v:: Send {`%}
    +b:: Send {^}
    +n:: Send {&}
    +m:: Send {*}
    <+Up:: Send {PgUp}
    <+Left:: Send {Home}
    <+Down:: Send {PgDn}
    <+Right:: Send {End}
    `; & q:: Send {Q}
    `; & w:: Send {W}
    `; & e:: Send {E}
    `; & r:: Send {R}
    `; & t:: Send {T}
    `; & y:: Send {Y}
    `; & u:: Send {U}
    `; & i:: Send {I}
    `; & o:: Send {O}
    `; & p:: Send {P}
    `; & a:: Send {A}
    `; & s:: Send {S}
    `; & d:: Send {D}
    `; & f:: Send {F}
    `; & g:: Send {G}
    `; & h:: Send {H}
    `; & j:: Send {J}
    `; & k:: Send {K}
    `; & l:: Send {L}
    `; & z:: Send {Z}
    `; & x:: Send {X}
    `; & c:: Send {C}
    `; & v:: Send {V}
    `; & b:: Send {B}
    `; & n:: Send {N}
    `; & m:: Send {M}
#If tenkeytoggle
    2:: Send {*}
    3:: Send {/}
    q:: Send {-}
    w:: Send {Numpad7}
    e:: Send {Numpad8}
    r:: Send {Numpad9}
    a:: Send {+}
    s:: Send {Numpad4}
    d:: Send {Numpad5}
    f:: Send {Numpad6}
    z:: Send {Enter}
    x:: Send {Numpad1}
    c:: Send {Numpad2}
    v:: Send {Numpad3}
    Space:: Send {Numpad0}
