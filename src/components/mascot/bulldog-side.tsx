/**
 * The club mascot, side view (faces left; flip with CSS for right).
 * Traced from the team's own drawing and coloured like the crest dog: white with red line work,
 * red ears and spiked collar. Parts carry class names so CSS can animate them:
 * .m-leg-a/.m-leg-b swing, .m-upper lifts/lowers, .m-head nods, .m-tail wags.
 */
const NAVY = "#28357C";
const RED = "#D32427";
const WHITE = "#FFFFFF";
const FAR = "#EEF0F6"; // far-side legs, a touch darker than white
const LINE = { stroke: RED, strokeWidth: 13, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function BulldogSide({ asleep = false, className }: { asleep?: boolean; className?: string }) {
  return (
    <svg viewBox="80 80 1350 870" className={className} aria-hidden>
      <g {...LINE}>
        {/* far legs, behind the body */}
        <g className="m-leg m-leg-b">
          <path
            d="M410 715 L422 848 C380 852 365 875 365 900 C365 918 375 928 388 928 L490 928 L490 740 Z"
            fill={FAR}
          />
        </g>
        <g className="m-leg m-leg-a">
          <path
            d="M1045 740 L1060 850 C1030 855 1012 875 1012 898 C1012 916 1022 928 1036 928 L1110 928 L1110 760 Z"
            fill={FAR}
          />
        </g>
        <g className="m-upper">
          {/* body */}
          <path
            d="M240 215 C280 150 350 128 440 126 C520 124 590 170 615 220 L655 320 C690 355 735 368 790 366 L1150 362 C1190 365 1240 405 1265 455 C1300 520 1318 590 1322 650 C1326 712 1290 748 1236 748 C1120 748 1050 700 985 690 C880 730 760 742 670 740 L480 735 C400 718 345 668 337 600 L335 540 C300 530 285 505 280 470 L240 300 L205 250 C210 235 225 222 240 215 Z"
            fill={WHITE}
          />
          <path
            className="m-tail"
            d="M1198 335 C1198 300 1222 293 1238 297 C1275 305 1295 345 1294 385 C1292 420 1280 445 1263 458 C1245 430 1215 400 1176 380 C1195 370 1198 352 1198 335 Z"
            fill={RED}
          />
          {/* red spiked collar, like the crest */}
          <path d="M560 205 C600 245 625 290 640 340" fill="none" stroke={RED} strokeWidth="44" />
          <path
            d="M572 186 l-28 -10 l16 26 z M614 248 l-30 -2 l22 22 z M640 310 l-30 6 l26 16 z"
            fill={WHITE}
            strokeWidth="8"
          />
          <g className="m-head">
            <path
              d="M470 118 C500 112 525 125 545 140 L600 178 C620 192 618 222 598 232 L530 262 C505 272 485 262 476 236 L455 165 C448 140 455 122 470 118 Z"
              fill={RED}
            />
            <path d="M318 196 q36 -20 74 4" fill="none" />
            {asleep ? (
              <path d="M330 242 Q350 258 372 242" fill="none" stroke={NAVY} strokeWidth="11" />
            ) : (
              <circle cx="350" cy="238" r="19" fill={NAVY} stroke="none" />
            )}
            {/* jowls, chin, tooth, nose */}
            <path
              d="M160 290 C185 270 220 255 255 262 C300 272 318 310 325 350 C335 400 340 440 338 470 C336 500 315 515 292 515 C265 515 248 495 246 470 L246 468 L205 468 C195 485 180 490 163 490 C135 490 118 470 118 440 L118 360 C118 320 135 300 160 290 Z"
              fill={WHITE}
            />
            <path d="M200 330 v120" fill="none" strokeWidth="9" />
            <path d="M200 322 L213 298 L235 322 Z" fill={WHITE} />
            <path
              d="M160 262 C170 250 200 247 212 252 C220 258 214 268 205 278 L185 296 C178 302 170 298 166 290 L156 272 C153 266 155 264 160 262 Z"
              fill={NAVY}
              stroke="none"
            />
          </g>
        </g>
        {/* near legs: back leg is a rounded thigh, hock angled back, paw under the hip */}
        <g className="m-leg m-leg-b">
          <path
            d="M1030 682 C1030 624 1078 588 1140 588 C1210 588 1262 632 1272 700 C1280 752 1282 800 1276 840 L1268 898 C1265 916 1252 928 1234 928 L1132 928 C1114 928 1106 916 1108 898 C1110 870 1130 852 1170 852 L1180 806 C1110 796 1052 768 1036 730 C1032 716 1030 700 1030 682 Z"
            fill={WHITE}
          />
        </g>
        <g className="m-leg m-leg-a">
          <path
            d="M480 660 C485 610 530 582 585 580 C645 580 685 615 680 690 L650 885 C645 910 630 928 600 928 L455 928 C440 928 432 915 432 895 C432 868 452 848 490 848 Z"
            fill={WHITE}
          />
        </g>
      </g>
    </svg>
  );
}
