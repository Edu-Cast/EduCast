package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.Subject;
import com.educast.capstone.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface PodcastRepository extends JpaRepository<Podcast, Long> {
    List<Podcast> findByAuthor(User author);
    Optional<Podcast> findByIdAndAuthor(Long id, User author);

    @Query("SELECT p FROM Podcast p JOIN FETCH p.author WHERE p.id = :id")
    Optional<Podcast> findByIdWithAuthor(@Param("id") Long id);

    List<Podcast> findTop10ByOrderByScoreDesc();

    List<Podcast> findByAuthorOrderByCreatedAtDesc(User author);

    List<Podcast> findTop10BySubjectOrderByScoreDesc(Subject subject);

    @Query(value = """
    SELECT * FROM (
        SELECT p.*, 
               CASE WHEN :query IS NULL OR :query = '' THEN 0
               ELSE ts_rank(
                   to_tsvector('simple', coalesce(p.title, '')) ||
                   to_tsvector('simple', coalesce(p.description, '')),
                   plainto_tsquery('simple', :query)
               ) END AS rank
        FROM podcasts p
        JOIN users u ON p.author_id = u.id
        WHERE
            (:query IS NULL OR :query = '' OR (
                to_tsvector('simple', coalesce(p.title, '')) ||
                to_tsvector('simple', coalesce(p.description, ''))
            ) @@ plainto_tsquery('simple', :query)
            OR u.login ILIKE '%' || :query || '%')
        AND (:subject IS NULL OR p.subject = :subject)
        AND (:educationLevel IS NULL OR p.education_level = :educationLevel)
    ) AS results
    ORDER BY rank DESC, created_at DESC
    LIMIT 10
    """, nativeQuery = true)
    List<Podcast> search(
            @Param("query") String query,
            @Param("subject") String subject,
            @Param("educationLevel") String educationLevel
    );


}