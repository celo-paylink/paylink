import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import prisma from "../lib/prisma";
interface JwtPayload {
  id: string;
}

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.id },
      });

      const data = {
        id: user?.id,
        name: user?.name,
        walletAddress: user?.walletAddress,
        createdAt: user?.createdAt,
      };

      if (user) return done(null, data);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
