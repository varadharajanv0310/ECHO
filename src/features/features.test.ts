import { describe, it, expect, beforeEach } from "vitest";
import {
  createPost,
  sharePost,
  unsharePost,
  POST_LIFETIMES,
  POST_MAX_LENGTH,
  searchPosts,
  searchUsers,
  usersInCommunity,
  postsInCommunity,
  postsByUser,
  expiringPosts,
  createAccount,
  updateProfile,
  toggleFollow,
  sendMessage,
  commentOnPost,
  MESSAGE_MAX_LENGTH,
} from "./index";
import { useSequence, DEFAULT_SETTINGS } from "@/store";
import { getSky } from "@/scene/sky-data";

/**
 * The feature layer is a set of renames over the store, so these tests check
 * exactly that: that each conventional name reaches the mechanic it claims to,
 * and that the caps it advertises are real.
 */

const profile = {
  name: "Wren",
  hue: 276,
  mark: "star",
  worlds: ["The Long Quiet"],
  bio: "listening",
  traits: ["Calm"],
};

beforeEach(() => {
  useSequence.setState({
    profile,
    emissions: [],
    carried: [],
    friends: [],
    dms: [],
    settings: { ...DEFAULT_SETTINGS },
  });
});

describe("posts", () => {
  it("createPost publishes into the community it was given", () => {
    createPost("The Long Quiet", "The gutters are singing", 24);
    const [post] = useSequence.getState().emissions;
    expect(post.world).toBe("The Long Quiet");
    expect(post.text).toBe("The gutters are singing");
    expect(post.life).toBe(24);
  });

  it("caps a post at the length it advertises", () => {
    createPost("The Long Quiet", "x".repeat(POST_MAX_LENGTH + 200), 24);
    expect(useSequence.getState().emissions[0].text).toHaveLength(POST_MAX_LENGTH);
  });

  it("offers exactly the lifetimes the interface offers", () => {
    expect([...POST_LIFETIMES]).toEqual([12, 24, 72]);
  });

  it("sharePost keeps the original author with the copy", () => {
    sharePost(41, "Mira", 300, "Nothing happened today");
    const [shared] = useSequence.getState().carried;
    expect(shared.from).toBe("Mira");
    expect(shared.source).toBe(41);
    expect(shared.hue).toBe(300);
  });

  it("the same post cannot be shared twice", () => {
    sharePost(41, "Mira", 300, "Nothing happened today");
    sharePost(41, "Mira", 300, "Nothing happened today");
    expect(useSequence.getState().carried).toHaveLength(1);
  });

  it("unsharePost removes it again", () => {
    sharePost(41, "Mira", 300, "Nothing happened today");
    unsharePost(41);
    expect(useSequence.getState().carried).toHaveLength(0);
  });
});

describe("feed", () => {
  const sky = getSky();

  it("a community contains the users who publish there", () => {
    const community = sky.constellations[0].world;
    const users = usersInCommunity(sky, community);
    expect(users.length).toBeGreaterThan(0);
    for (const u of users) {
      expect(sky.constellations[u.constellation].world).toBe(community);
    }
  });

  it("returns nothing for a community that does not exist", () => {
    expect(usersInCommunity(sky, "Nowhere")).toEqual([]);
    expect(postsInCommunity(sky, "Nowhere")).toEqual([]);
  });

  it("every post in a community belongs to a user in it", () => {
    const community = sky.constellations[1].world;
    const ids = new Set(usersInCommunity(sky, community).map((u) => u.id));
    for (const p of postsInCommunity(sky, community))
      expect(ids.has(p.star)).toBe(true);
  });

  it("postsByUser returns only that user's posts", () => {
    const posts = postsByUser(sky, 3);
    for (const p of posts) expect(p.star).toBe(3);
  });

  it("expiringPosts surfaces what is about to be lost, not what is winning", () => {
    for (const p of expiringPosts(sky)) expect(p.age).toBeGreaterThan(0.72);
  });
});

describe("discovery", () => {
  const sky = getSky();

  it("searchPosts matches on the body, case-insensitively", () => {
    const term = sky.planets[0].text.split(" ")[1] ?? "the";
    const hits = searchPosts(sky, term.toUpperCase());
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.text.toLowerCase()).toContain(term.toLowerCase());
  });

  it("returns nothing rather than everything for a term nobody used", () => {
    expect(searchPosts(sky, "zzzqqxx")).toEqual([]);
  });

  it("honours the community filter", () => {
    const community = sky.constellations[2].world;
    const hits = searchPosts(sky, "", { community });
    const ids = new Set(usersInCommunity(sky, community).map((u) => u.id));
    for (const h of hits) expect(ids.has(h.star)).toBe(true);
  });

  it("honours the result limit", () => {
    expect(searchPosts(sky, "", { limit: 5 })).toHaveLength(5);
  });

  it("is unranked: the same query always returns the same order", () => {
    const a = searchPosts(sky, "").map((p) => p.id);
    const b = searchPosts(sky, "").map((p) => p.id);
    expect(a).toEqual(b);
    // and that order is not the stored one, which would group by author
    const stored = sky.planets.slice(0, a.length).map((p) => p.id);
    expect(a).not.toEqual(stored);
  });

  it("searchUsers filters by interest", () => {
    const trait = sky.stars[0].traits[0];
    for (const u of searchUsers(sky, "", { trait })) {
      expect(u.traits).toContain(trait);
    }
  });
});

describe("profile", () => {
  it("createAccount and updateProfile merge rather than replace", () => {
    createAccount({ ...profile, name: "Ash" });
    updateProfile({ status: "quiet" });
    const p = useSequence.getState().profile!;
    expect(p.name).toBe("Ash");
    expect(p.status).toBe("quiet");
    expect(p.traits).toEqual(["Calm"]);
  });

  it("toggleFollow adds and removes", () => {
    toggleFollow(7);
    expect(useSequence.getState().friends).toContain(7);
    toggleFollow(7);
    expect(useSequence.getState().friends).not.toContain(7);
  });
});

describe("messaging", () => {
  it("sendMessage reaches the right conversation", () => {
    sendMessage(5, "Mira", "are you still there");
    const [m] = useSequence.getState().dms;
    expect(m.withStar).toBe(5);
    expect(m.mine).toBe(true);
    expect(m.text).toBe("are you still there");
  });

  it("caps a message at the length it advertises", () => {
    sendMessage(5, "Mira", "x".repeat(MESSAGE_MAX_LENGTH + 100));
    expect(useSequence.getState().dms[0].text).toHaveLength(MESSAGE_MAX_LENGTH);
  });

  it("commentOnPost keeps what it was answering", () => {
    commentOnPost(5, "Mira", "Nothing happened today", "it did to me");
    const [m] = useSequence.getState().dms;
    expect(m.onText).toBe("Nothing happened today");
    expect(m.text).toBe("it did to me");
  });
});
