from tests.conftest import read_project_file


def test_saved_podcasts_route_is_authenticated_before_public_wildcard():
    security = read_project_file("backend/src/main/java/com/educast/capstone/Configuration/SecurityConfig.java")

    saved_rule = '.requestMatchers(HttpMethod.GET, "/api/podcasts/saved").authenticated()'
    wildcard_rule = '.requestMatchers(HttpMethod.GET, "/api/podcasts/*").permitAll()'

    assert saved_rule in security
    assert wildcard_rule in security
    assert security.index(saved_rule) < security.index(wildcard_rule)


def test_security_keeps_public_catalog_and_auth_endpoints_explicit():
    security = read_project_file("backend/src/main/java/com/educast/capstone/Configuration/SecurityConfig.java")

    assert '.requestMatchers("/api/auth/**").permitAll()' in security
    assert '.requestMatchers(HttpMethod.GET, "/api/podcasts").permitAll()' in security
    assert '.requestMatchers(HttpMethod.GET, "/api/podcasts/search").permitAll()' in security
    assert '.requestMatchers(HttpMethod.GET, "/api/podcasts/popular/**").permitAll()' in security
    assert '.anyRequest().authenticated()' in security
    assert 'SessionCreationPolicy.STATELESS' in security


def test_user_service_contains_registration_login_and_verification_guards():
    service = read_project_file("backend/src/main/java/com/educast/capstone/Service/UserService.java")

    expected = [
        'existsByEmail(request.getEmail())',
        'existsByLogin(request.getLogin())',
        'passwordValidator.validate(request.getPassword())',
        'emailService.sendVerificationCode',
        'userToVerify.setConfirmed(true)',
        'throw new IllegalArgumentException("Wrong code")',
        'throw new IllegalArgumentException("Email is not verified")',
        'passwordEncoder.matches(request.getPassword(), user.getPassword())',
        'jwtService.generateToken(user.getEmail(), user.getId())',
    ]
    for marker in expected:
        assert marker in service


def test_vote_save_and_comment_services_cover_core_interaction_branches():
    vote_service = read_project_file("backend/src/main/java/com/educast/capstone/Service/VoteService.java")
    saved_service = read_project_file("backend/src/main/java/com/educast/capstone/Service/SavedPodcastService.java")
    comment_service = read_project_file("backend/src/main/java/com/educast/capstone/Service/CommentService.java")

    assert 'voteRepository.findByUserAndPodcast(currentUser, podcast)' in vote_service
    assert 'podcast.setScore(podcast.getScore() - voteValue)' in vote_service
    assert 'podcast.setScore(podcast.getScore() - pv.getVote() + voteValue)' in vote_service
    assert 'voteRepository.save(new PodcastVote(currentUser, podcast, voteValue))' in vote_service

    assert 'savedPodcastRepository.findByUserAndPodcast(currentUser, podcast)' in saved_service
    assert 'savedPodcastRepository.delete(existing.get())' in saved_service
    assert 'savedPodcastRepository.save(new SavedPodcast(currentUser, podcast))' in saved_service

    assert 'commentRepository.findByPodcastOrderByCreatedAtDesc(podcast)' in comment_service
    assert 'boolean isAuthor' in comment_service
    assert 'boolean isPodcastOwner' in comment_service
    assert 'commentRepository.delete(comment)' in comment_service
